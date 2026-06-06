export const ANIMATION_TAGS = Object.freeze([
  'idle',
  'wave',
  'happy',
  'thinking',
  'encourage',
  'celebrate',
  'sleepy',
  'concerned',
  'explain',
  'fallback',
]);

export const DEFAULT_TEMPLATE_ID = '3db49434-0796-40dd-8f64-4e663f164ac8';
export const DEFAULT_PROJECT_ID = 'prj_07c5f076-235f-475d-b616-a776c294801f';
export const DEFAULT_PROJECT_API_BASE_URL = 'https://api.cloud-station.io';

const FALLBACK_MESSAGE = 'Peep! I can still help, but I only have a safe fallback response right now.';

export function isAnimationTag(value) {
  return ANIMATION_TAGS.includes(value);
}

export function sanitizeAnimationTag(value) {
  return isAnimationTag(value) ? value : 'fallback';
}

function sanitizeMessage(value) {
  if (typeof value !== 'string') {
    return FALLBACK_MESSAGE;
  }

  const trimmed = value.trim();
  return trimmed || FALLBACK_MESSAGE;
}

function sanitizeIntent(value) {
  if (typeof value !== 'string') {
    return 'fallback';
  }

  const trimmed = value.trim();
  return trimmed || 'fallback';
}

function sanitizePayload(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return value;
}

export function tamachickResponse({
  animationTag,
  message,
  intent,
  payload,
} = {}) {
  return {
    animation_tag: sanitizeAnimationTag(animationTag),
    message: sanitizeMessage(message),
    intent: sanitizeIntent(intent),
    payload: sanitizePayload(payload),
  };
}

export function animationResponse(tag) {
  return tamachickResponse({ animationTag: tag });
}
