import { DEFAULT_PROJECT_API_BASE_URL, DEFAULT_PROJECT_ID, DEFAULT_TEMPLATE_ID } from './contracts.js';

function readInt(value, fallback) {
  const parsed = Number.parseInt(value ?? '', 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function getConfig(env = process.env) {
  return {
    port: readInt(env.PORT, 3100),
    projectApiKey: env.TAMACHICK_PROJECT_API_KEY || null,
    projectApiClientId: env.TAMACHICK_PROJECT_API_CLIENT_ID || null,
    projectId: env.TAMACHICK_PROJECT_ID || DEFAULT_PROJECT_ID,
    projectApiBaseUrl: env.TAMACHICK_API_BASE_URL || DEFAULT_PROJECT_API_BASE_URL,
    queryRouterTemplateId: DEFAULT_TEMPLATE_ID,
    requestTimeoutMs: 10000,
  };
}
