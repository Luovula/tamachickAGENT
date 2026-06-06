import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { getConfig } from '../src/config.js';

function hasRichResponseShape(body) {
  return (
    typeof body.animation_tag === 'string'
    && typeof body.message === 'string'
    && typeof body.intent === 'string'
    && body.payload
    && typeof body.payload === 'object'
    && !Array.isArray(body.payload)
  );
}

function testConfig(overrides = {}) {
  return {
    port: 3100,
    projectApiKey: null,
    projectApiClientId: null,
    projectId: 'prj_test',
    projectApiBaseUrl: 'https://example.test',
    queryRouterTemplateId: 'template-id',
    requestTimeoutMs: 1000,
    ...overrides,
  };
}

test('getConfig reads Project API credentials plus non-secret upstream routing env vars', () => {
  const config = getConfig({
    PORT: '3200',
    TAMACHICK_PROJECT_API_KEY: 'project-key',
    TAMACHICK_PROJECT_API_CLIENT_ID: 'client-id',
    TAMACHICK_PROJECT_ID: 'prj_custom',
    TAMACHICK_API_BASE_URL: 'https://backend.example.test',
    TAMACHICK_QUERY_ROUTER_TEMPLATE_ID: 'template-custom',
    TAMACHICK_UPSTREAM_TIMEOUT_MS: '2500',
  });

  assert.equal(config.port, 3200);
  assert.equal(config.projectApiKey, 'project-key');
  assert.equal(config.projectApiClientId, 'client-id');
  assert.equal(config.projectId, 'prj_custom');
  assert.equal(config.projectApiBaseUrl, 'https://backend.example.test');
  assert.equal(config.queryRouterTemplateId, 'template-custom');
  assert.equal(config.requestTimeoutMs, 2500);
});

test('getConfig provides safe non-env defaults for Project API routing', () => {
  const config = getConfig({});

  assert.equal(config.projectId, 'prj_07c5f076-235f-475d-b616-a776c294801f');
  assert.equal(config.projectApiBaseUrl, 'https://api.cloud-station.io');
});

test('GET /health reports local fallback when Project API credentials are incomplete', async () => {
  const app = createApp({ config: testConfig() });

  const response = await request(app).get('/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.status, 'ok');
  assert.equal(response.body.service, 'tamachick-api');
  assert.equal(response.body.mode, 'local-fallback');
});

test('GET /health reports upstream-ready when Project API key and client ID are configured', async () => {
  const app = createApp({
    config: testConfig({ projectApiKey: 'project-key', projectApiClientId: 'client-id' }),
  });

  const response = await request(app).get('/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.mode, 'upstream-ready');
});

test('POST /api/tamachick/query preserves animation tag while returning rich fallback fields locally', async () => {
  const app = createApp({ config: testConfig() });

  const response = await request(app)
    .post('/api/tamachick/query')
    .send({ message: 'Can you cheer me up?' });

  assert.equal(response.status, 200);
  assert.equal(response.body.animation_tag, 'encourage');
  assert.equal(hasRichResponseShape(response.body), true);
  assert.equal(response.body.intent, 'fallback');
});

test('POST /api/tamachick/query validates schema-invalid bodies with safe rich fallback contract', async () => {
  const app = createApp({ config: testConfig() });

  const response = await request(app)
    .post('/api/tamachick/query')
    .send({ message: '' });

  assert.equal(response.status, 400);
  assert.equal(response.body.animation_tag, 'fallback');
  assert.equal(hasRichResponseShape(response.body), true);
});

test('POST /api/tamachick/query returns fallback JSON for malformed JSON syntax', async () => {
  const app = createApp({ config: testConfig() });

  const response = await request(app)
    .post('/api/tamachick/query')
    .set('Content-Type', 'application/json')
    .send('{"message": "hi"');

  assert.equal(response.status, 400);
  assert.equal(response.headers['content-type'], 'application/json; charset=utf-8');
  assert.equal(response.body.animation_tag, 'fallback');
  assert.equal(hasRichResponseShape(response.body), true);
});

test('POST /api/tamachick/query calls Project API with x-api-key and x-client-id headers', async () => {
  const app = createApp({
    config: testConfig({ projectApiKey: 'project-key', projectApiClientId: 'client-id' }),
    fetchImpl: async (url, options) => {
      assert.equal(String(url), 'https://example.test/v1/projects/prj_test/api/message');
      assert.equal(options.method, 'POST');
      assert.equal(options.headers['x-api-key'], 'project-key');
      assert.equal(options.headers['x-client-id'], 'client-id');
      assert.equal(options.headers.authorization, undefined);
      const body = JSON.parse(options.body);
      assert.equal(body.conversation_id, 'tamachick-api-session-1');
      assert.equal(body.message, 'Explain this to me');
      assert.equal(body.platform, 'tamachick-api');
      assert.equal(body.agent_template_id, 'template-id');
      assert.deepEqual(body.sender, { id: 'user-1' });
      assert.deepEqual(body.metadata.context, { source: 'test' });

      return {
        ok: true,
        status: 202,
        json: async () => ({
          status: 'accepted',
          adw_id: 'adw-1',
          conversation_id: 'tamachick-api-session-1',
          message_id: 'message-1',
        }),
      };
    },
  });

  const response = await request(app)
    .post('/api/tamachick/query')
    .send({
      message: 'Explain this to me',
      user_id: 'user-1',
      session_id: 'session-1',
      context: { source: 'test' },
    });

  assert.equal(response.status, 202);
  assert.equal(response.body.animation_tag, 'explain');
  assert.equal(hasRichResponseShape(response.body), true);
  assert.equal(response.body.intent, 'pending');
  assert.deepEqual(response.body.payload, {
    status: 'accepted',
    pending: true,
    adw_id: 'adw-1',
    conversation_id: 'tamachick-api-session-1',
    message_id: 'message-1',
  });
});

test('POST /api/tamachick/query preserves upstream rich fields when synchronous content is returned', async () => {
  const app = createApp({
    config: testConfig({ projectApiKey: 'project-key', projectApiClientId: 'client-id' }),
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        animation_tag: 'celebrate',
        message: 'Peep peep! You shipped it — time for a tiny sparkle party.',
        intent: 'celebration_reflection',
        payload: {
          reflection_prompt: 'What made this win possible?',
        },
      }),
    }),
  });

  const response = await request(app)
    .post('/api/tamachick/query')
    .send({ message: 'Great job' });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    animation_tag: 'celebrate',
    message: 'Peep peep! You shipped it — time for a tiny sparkle party.',
    intent: 'celebration_reflection',
    payload: {
      reflection_prompt: 'What made this win possible?',
    },
  });
});

test('POST /api/tamachick/query extracts rich fields from JSON string upstream content', async () => {
  const app = createApp({
    config: testConfig({ projectApiKey: 'project-key', projectApiClientId: 'client-id' }),
    fetchImpl: async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        response: JSON.stringify({
          animation_tag: 'thinking',
          message: 'Let’s hatch a three-step plan.',
          intent: 'flow_chick',
          payload: { steps: ['Pick one task', 'Do ten minutes', 'Report back'] },
        }),
      }),
    }),
  });

  const response = await request(app)
    .post('/api/tamachick/query')
    .send({ message: 'Help me plan' });

  assert.equal(response.status, 200);
  assert.deepEqual(response.body, {
    animation_tag: 'thinking',
    message: 'Let’s hatch a three-step plan.',
    intent: 'flow_chick',
    payload: { steps: ['Pick one task', 'Do ten minutes', 'Report back'] },
  });
});

test('POST /api/tamachick/query falls back safely when Project API returns an error', async () => {
  const app = createApp({
    config: testConfig({ projectApiKey: 'project-key', projectApiClientId: 'client-id' }),
    fetchImpl: async () => ({
      ok: false,
      status: 403,
      json: async () => ({ error: 'forbidden' }),
    }),
  });

  const response = await request(app)
    .post('/api/tamachick/query')
    .send({ message: 'I am exhausted today' });

  assert.equal(response.status, 200);
  assert.equal(response.body.animation_tag, 'sleepy');
  assert.equal(hasRichResponseShape(response.body), true);
  assert.equal(response.body.intent, 'fallback');
});
