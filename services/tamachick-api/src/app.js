import express from 'express';
import { z } from 'zod';
import { animationResponse, tamachickResponse } from './contracts.js';
import { getConfig } from './config.js';
import { classifyAnimationTag } from './router.js';
import { resolveTamachickResponse } from './upstreamClient.js';

const querySchema = z
  .object({
    message: z.string().trim().min(1).max(500),
    user_id: z.string().trim().min(1).max(200).optional(),
    session_id: z.string().trim().min(1).max(200).optional(),
    context: z.record(z.unknown()).optional(),
  })
  .strict();

function runtimeMode(config) {
  return config.projectApiKey && config.projectApiClientId
    ? 'upstream-ready'
    : 'local-fallback';
}

function isMalformedJsonError(error) {
  return (
    error instanceof SyntaxError
    && error.status === 400
    && error.type === 'entity.parse.failed'
    && 'body' in error
  );
}

export function createApp({ config = getConfig(), fetchImpl } = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '100kb' }));

  app.get('/', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'tamachick-api',
      mode: runtimeMode(config),
    });
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'tamachick-api',
      mode: runtimeMode(config),
    });
  });

  app.post('/api/tamachick/query', async (req, res) => {
    const parsed = querySchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json(animationResponse('fallback'));
    }

    const result = await resolveTamachickResponse({
      message: parsed.data.message,
      userId: parsed.data.user_id,
      sessionId: parsed.data.session_id,
      context: parsed.data.context,
      config,
      fetchImpl,
      fallbackResolver: classifyAnimationTag,
    });

    return res.status(200).json(tamachickResponse(result));
  });

  app.use((error, _req, res, next) => {
    if (isMalformedJsonError(error)) {
      return res.status(400).json(animationResponse('fallback'));
    }

    return next(error);
  });

  app.use((_req, res) => {
    res.status(404).json({ status: 'not_found' });
  });

  return app;
}
