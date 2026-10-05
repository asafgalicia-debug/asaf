import express from 'express';
import {env} from '../../config/env.js';
import {requestEmailVerification,confirmEmailVerification} from './emailVerification.js';
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
  const emailConfig=()=>({apiKey:env.RESEND_API_KEY,from:env.RESEND_FROM,baseUrl:env.EMAIL_VERIFICATION_BASE_URL});
  const html=(res:Response,title:string,body:string)=>res.set({'Cache-Control':'no-store','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'"}).type('html').send('<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+'</title><h1>'+title+'</h1>'+body+'</html>');
  router.post('/email-verification/request',authenticate,tenant,async(req,res,next)=>{try{const t=req.tenant;if(!t?.userId||!t.companyId||!t.branchId)throw new AppError({code:'UNAUTHORIZED',message:'Missing tenant',friendlyMessage:'Inicia sesión.',statusCode:401});res.json({ok:true,data:await requestEmailVerification({id:t.userId,companyId:t.companyId,branchId:t.branchId},emailConfig())});}catch(e){next(e);}});
  router.get('/email-verification/start',(_req,res)=>html(res,'Verificar correo de Núcleo ERP','<p>Ingresa tus credenciales del ERP para solicitar el correo. Por ahora Resend permite la prueba con el correo de su cuenta.</p><form method="post"><label>Correo <input type="email" name="email" required autocomplete="username" maxlength="254"></label><p><label>Contraseña <input type="password" name="password" required autocomplete="current-password" maxlength="72"></label></p><button>Enviar correo de verificación</button></form>'));
  router.post('/email-verification/start',loginRateLimit,express.urlencoded({extended:false,limit:'4kb'}),async(req,res,next)=>{try{const input=loginSchema.safeParse(req.body);if(!input.success)throw new AppError({code:'VALIDATION_ERROR',message:'Invalid credentials',friendlyMessage:'Revisa tus credenciales.',statusCode:400});const result=await authenticateCredentials(input.data);const status=await requestEmailVerification({id:result.user.id,companyId:result.user.companyId,branchId:result.user.branchId},emailConfig());html(res,status.status==='verified'?'Correo ya verificado':'Correo enviado','<p>'+ (status.status==='verified'?'Tu correo ya fue confirmado.':'Revisa tu bandeja y correo no deseado. El enlace caduca en 15 minutos.')+'</p>');}catch(e){next(e);}});
  router.get('/email-verification/confirm',(req,res)=>{const token=req.query.token;if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token)){res.status(400);html(res,'Enlace inválido','<p>Solicita un nuevo correo.</p>');return;}html(res,'Confirmar correo','<p>Pulsa el botón para confirmar tu dirección de correo.</p><form method="post" action="confirm"><input type="hidden" name="token" value="'+token+'"><button>Confirmar correo</button></form>');});
  router.post('/email-verification/confirm',express.urlencoded({extended:false,limit:'4kb'}),async(req,res,next)=>{try{await confirmEmailVerification(req.body?.token);html(res,'Correo verificado','<p>Tu dirección de correo quedó confirmada. Puedes volver al ERP.</p>');}catch(e){next(e);}});
  return router;
}
