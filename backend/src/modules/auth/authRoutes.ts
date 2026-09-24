import { Router, type NextFunction, type Request, type Response } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { logAuditEvent } from '../../audit/auditLogger.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { authenticateCredentials } from './authService.js';

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_MAX_REQUESTS = 10;
const LOGIN_MAX_TRACKED_IPS = 20000;
const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(72).refine((value) => Buffer.byteLength(value, 'utf8') <= 72)
}).strict();

function loginRateLimit(req: Request, _res: Response, next: NextFunction): void {
  const now = Date.now();
  for (const [key, entry] of loginAttempts) if (entry.resetAt <= now) loginAttempts.delete(key);
  const key = req.ip || req.socket.remoteAddress || 'unknown';
  const current = loginAttempts.get(key);
  if (!current || current.resetAt <= now) {
    while (loginAttempts.size >= LOGIN_MAX_TRACKED_IPS) {
      const oldestKey = loginAttempts.keys().next().value;
      if (!oldestKey) break;
      loginAttempts.delete(oldestKey);
    }
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    next();
    return;
  }
  if (current.count >= LOGIN_MAX_REQUESTS) {
    next(new AppError({ code: 'RATE_LIMITED', message: 'Too many login attempts', friendlyMessage: 'Has realizado demasiados intentos. Espera unos minutos e intentalo de nuevo.', statusCode: 429 }));
    return;
  }
  current.count += 1;
  next();
}

export function createAuthRoutes(): Router {
  const router = Router();
  router.post('/login', loginRateLimit, async (req, res, next) => {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid login request', friendlyMessage: 'Escribe un email valido y una contrasena.', statusCode: 400 });
      const result = await authenticateCredentials(parsed.data);
      await logAuditEvent({ userId: result.user.id, companyId: result.user.companyId, branchId: result.user.branchId, action: 'LOGIN', module: 'auth', ipAddress: req.ip });
      res.status(200).json({ ok: true, data: result });
    } catch (error) { next(error); }
  });
  router.get('/profile', authenticate, tenant, authorize('auth.profile'), (req, res) => {
    res.json({ ok: true, data: { user: req.user, tenant: req.tenant } });
  });
  return router;
}
