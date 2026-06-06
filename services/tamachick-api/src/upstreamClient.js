import { sanitizeAnimationTag } from './contracts.js';

function buildConversationId({ userId, sessionId }) {
  const raw = sessionId || userId || 'anonymous';
  const normalized = String(raw)
    .trim()
    .replace(/[^a-zA-Z0-9._:-]/g, '-')
    .slice(0, 220);

  return `tamachick-api-${normalized || 'anonymous'}`;
}

function parseJsonString(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || !trimmed.startsWith('{')) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function firstString(...values) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function firstObject(...values) {
  for (const value of values) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value;
    }
  }

  return undefined;
}

function acceptedPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return null;
  }

  if (payload.status !== 'accepted') {
    return null;
  }

  return {
    status: 'accepted',
    pending: true,
    adw_id: payload.adw_id,
    conversation_id: payload.conversation_id,
    message_id: payload.message_id,
  };
}

function normalizeUpstreamContent(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {};
  }

  const embeddedJson = parseJsonString(payload.response)
    || parseJsonString(payload.content)
    || parseJsonString(payload.text)
    || parseJsonString(payload.message)
    || parseJsonString(payload.output);

  const source = embeddedJson || firstObject(
    payload.result,
    payload.data,
    payload.output,
    payload.response,
    payload.content,
  ) || payload;

  const nested = firstObject(source.result, source.data, source.output, source.response, source.content);
  const content = nested || source;

  return {
    animationTag: content.animation_tag || content.animationTag || payload.animation_tag || payload.animationTag,
    message: firstString(
      content.message,
      content.text,
      content.response,
      content.content,
      source.message,
      source.text,
      source.response,
      source.content,
      payload.message,
      payload.text,
      payload.response,
      payload.content,
    ),
    intent: firstString(
      content.intent,
      content.feature_intent,
      content.featureIntent,
      content.type,
      source.intent,
      source.feature_intent,
      source.featureIntent,
      source.type,
      payload.intent,
      payload.feature_intent,
      payload.featureIntent,
      payload.type,
    ),
    payload: firstObject(
      content.payload,
      content.structured_content,
      content.structuredContent,
      content.data,
      source.payload,
      source.structured_content,
      source.structuredContent,
      payload.payload,
      payload.structured_content,
      payload.structuredContent,
    ),
  };
}

export async function resolveTamachickResponse({
  message,
  userId,
  sessionId,
  context,
  config,
  fetchImpl = fetch,
  fallbackResolver,
}) {
  const fallbackTag = fallbackResolver(message);
  const fallback = {
    animationTag: fallbackTag,
    message: 'Peep! I can still help, but I only have a safe fallback response right now.',
    intent: 'fallback',
    payload: {},
  };

  if (!config.projectApiKey || !config.projectApiClientId) {
    return {
      ...fallback,
      mode: 'local-fallback',
      upstreamAttempted: false,
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const url = new URL(
      `/v1/projects/${config.projectId}/api/message`,
      config.projectApiBaseUrl,
    );

    const response = await fetchImpl(url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': config.projectApiKey,
        'x-client-id': config.projectApiClientId,
      },
      body: JSON.stringify({
        conversation_id: buildConversationId({ userId, sessionId }),
        message,
        platform: 'tamachick-api',
        agent_template_id: config.queryRouterTemplateId,
        sender: userId ? { id: userId } : undefined,
        metadata: {
          service: 'tamachick-api',
          context: context || {},
        },
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      console.warn('tamachick upstream Project API returned non-OK status', {
        status: response.status,
      });

      return {
        ...fallback,
        mode: 'upstream-error-fallback',
        upstreamAttempted: true,
        upstreamStatus: response.status,
      };
    }

    console.info('tamachick upstream Project API accepted request', {
      status: response.status,
    });

    let payload = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    const pendingPayload = acceptedPayload(payload);
    if (response.status === 202 && pendingPayload) {
      return {
        animationTag: fallbackTag,
        message: 'Peep! I received that and I am still working on the full response.',
        intent: 'pending',
        payload: pendingPayload,
        httpStatus: 202,
        mode: 'upstream-pending',
        upstreamAttempted: true,
        upstreamStatus: response.status,
      };
    }

    const upstreamContent = normalizeUpstreamContent(payload);

    return {
      animationTag: sanitizeAnimationTag(upstreamContent.animationTag || fallbackTag),
      message: upstreamContent.message || fallback.message,
      intent: upstreamContent.intent || fallback.intent,
      payload: upstreamContent.payload || fallback.payload,
      httpStatus: 200,
      mode: 'upstream',
      upstreamAttempted: true,
      upstreamStatus: response.status,
    };
  } catch {
    console.warn('tamachick upstream Project API request failed before acceptance');

    return {
      ...fallback,
      mode: 'upstream-error-fallback',
      upstreamAttempted: true,
      upstreamStatus: null,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function resolveAnimationTag(options) {
  const result = await resolveTamachickResponse(options);
  return {
    animationTag: result.animationTag,
    mode: result.mode,
    upstreamAttempted: result.upstreamAttempted,
    upstreamStatus: result.upstreamStatus,
  };
}
