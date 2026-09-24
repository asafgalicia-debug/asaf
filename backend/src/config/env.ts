import dotenv from 'dotenv';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

// Load the project-root environment file. Never log its values.
const projectEnvPath = resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env');
dotenv.config({ path: projectEnvPath });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(4000),
  API_URL: z.string().default('http://localhost:4000/api/v1'),
  JWT_SECRET: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().min(64, 'JWT_SECRET debe contener al menos 64 caracteres aleatorios').optional()
  ),
  JWT_EXPIRES_IN: z.string().default('15m'),
  MONGODB_URI: z.preprocess(
    (value) => typeof value === 'string' && value.trim() === '' ? undefined : value,
    z.string().regex(/^mongodb(?:\+srv)?:\/\//, 'MONGODB_URI debe comenzar con mongodb:// o mongodb+srv://').optional()
  ),
  MONGODB_DB_NAME: z.string().trim().default('erp_universal'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  LOG_LEVEL: z.string().default('info')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((issue) => String(issue.path.join('.') || 'env') + ': ' + issue.message).join(', ');
  throw new Error('ConfiguraciÃ³n invÃ¡lida: ' + issues);
}

export const env = parsed.data;