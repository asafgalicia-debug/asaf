import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { logAuditEvent } from '../../audit/auditLogger.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createProductionOrder, getProductionSummary, listProductionOrders } from './productionService.js';
const schema = z.object({ productId: z.string().trim().min(1).max(100), plannedQuantity: z.number().finite().positive() }).strict();
function scope(req: Request): { companyId: string; branchId: string; userId: string } { const t = req.tenant; if (!t?.companyId || !t.branchId || !t.userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context missing', friendlyMessage: 'La sesion no tiene empresa y sucursal activas.', statusCode: 401 }); return { companyId: t.companyId, branchId: t.branchId, userId: t.userId }; }
export function createProductionRoutes(): Router {
  const router = Router();
  router.get('/summary', authenticate, tenant, authorize('produccion.ver'), async (req, res, next) => { try { const s = scope(req); res.json({ ok: true, data: await getProductionSummary(s.companyId, s.branchId) }); } catch (error) { next(error); } });
  router.get('/orders', authenticate, tenant, authorize('produccion.ver'), async (req, res, next) => { try { const s = scope(req); res.json({ ok: true, data: await listProductionOrders(s.companyId, s.branchId) }); } catch (error) { next(error); } });
  router.post('/orders', authenticate, tenant, authorize('usuarios.editar'), async (req, res, next) => { try { const s = scope(req); const parsed = schema.safeParse(req.body); if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid production order', friendlyMessage: 'Revisa producto y cantidad planeada.', statusCode: 400 }); const row = await createProductionOrder({ ...parsed.data, companyId: s.companyId, branchId: s.branchId }); await logAuditEvent({ userId: s.userId, companyId: s.companyId, branchId: s.branchId, action: 'CREATE', module: 'produccion', entityId: row.id, details: { productId: row.productId, plannedQuantity: row.plannedQuantity }, ipAddress: req.ip }); res.status(201).json({ ok: true, data: row }); } catch (error) { next(error); } });
  return router;
}