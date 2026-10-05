import { parseCashQuery } from './cashPagination.js';
import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { pageCashMovements, createAuditedCashMovement, listCashMovements } from './cashMovementService.js';
const schema = z.object({ accountId: z.string().regex(/^[a-f0-9]{24}$/i), concept: z.string().trim().min(2).max(200), type: z.enum(['INFLOW','OUTFLOW']), amount: z.number().finite().positive().refine(value => Number.isSafeInteger(Math.round(value * 100)) && Math.abs(value * 100 - Math.round(value * 100)) < 0.000001 && Math.round(value * 100) > 0), date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(value => Number.isFinite(Date.parse(value+'T00:00:00Z')) && new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value) }).strict();
function scope(req: Request): { companyId: string; branchId: string; userId: string } { const t = req.tenant; if (!t?.companyId || !t.branchId || !t.userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context missing', friendlyMessage: 'La sesion no tiene empresa y sucursal activas.', statusCode: 401 }); return { companyId: t.companyId, branchId: t.branchId, userId: t.userId }; }
export function createCashMovementRoutes(): Router {
  const router = Router();
  router.get('/', authenticate, tenant, authorize('usuarios.ver'), async (req, res, next) => { try { const s = scope(req); res.json({ ok: true, data: await listCashMovements(s.companyId, s.branchId) }); } catch (error) { next(error); } });
  router.post('/', authenticate, tenant, authorize('usuarios.editar'), async (req, res, next) => { try { const s = scope(req); const parsed = schema.safeParse(req.body); if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid finance data', friendlyMessage: 'Revisa los datos financieros ingresados.', statusCode: 400 }); const row = await createAuditedCashMovement({ accountId: parsed.data.accountId, concept: parsed.data.concept, type: parsed.data.type, amount: parsed.data.amount, date: parsed.data.date, companyId: s.companyId, branchId: s.branchId }, { userId: s.userId, ipAddress: req.ip }); res.status(201).json({ ok: true, data: row }); } catch (error) { next(error); } });
  router.get('/page', authenticate, tenant, authorize('usuarios.ver'), async (req,res,next)=>{try{const s=scope(req);res.json({ok:true,data:await pageCashMovements(s.companyId,s.branchId,parseCashQuery(req.query))});}catch(error){next(error);}});
  return router;
}