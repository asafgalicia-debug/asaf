import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { isDatabaseReady } from './config/database.js';
import { env } from './config/env.js';
import { createAppRouter } from './routes/index.js';
import { errorHandler } from './errors/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { notFoundHandler } from './errors/notFoundHandler.js';

export const app = express();

app.disable('x-powered-by');
app.use(securityHeaders);
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.get(['/health', '/health/live'], (_req, res) => {
  res.status(200).json({ ok: true, status: 'live', service: 'erp-api' });
});

app.get('/health/ready', async (_req, res) => {
  if (!env.MONGODB_URI) return res.status(503).json({ ok: false, status: 'not_ready', database: 'not_configured' });
  const ready = await isDatabaseReady();
  if (!ready) return res.status(503).json({ ok: false, status: 'not_ready', database: 'unavailable' });
  return res.status(200).json({ ok: true, status: 'ready', database: env.MONGODB_DB_NAME });
});

app.use('/api/v1', createAppRouter());
app.use(notFoundHandler);
app.use(errorHandler);
