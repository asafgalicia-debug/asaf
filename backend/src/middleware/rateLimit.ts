import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError.js';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;
const ipStore = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(req: Request, _res: Response, next: NextFunction): void {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const current = ipStore.get(ip);

  if (!current || current.resetAt < now) {
    ipStore.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    next();
    return;
  }

  current.count += 1;

  if (current.count > MAX_REQUESTS) {
    next(new AppError({
      code: 'RATE_LIMITED',
      message: 'Límite de peticiones excedido',
      friendlyMessage: 'Has superado el límite de peticiones. Inténtalo más tarde.',
      statusCode: 429
    }));
    return;
  }

  next();
}
