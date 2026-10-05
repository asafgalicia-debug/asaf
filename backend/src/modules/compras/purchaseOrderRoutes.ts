import { createAuditedPurchaseOrder, updateAuditedPurchaseOrderStatus } from '../../core/commercialCreation.js';
import { parseCommercialQuery } from '../../core/commercialPagination.js';
import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { listPurchaseOrders, pagePurchaseOrders } from './purchaseOrderService.js';
const schema = z.object({ supplierId: z.string().trim().min(1).max(100), productId: z.string().trim().min(1).max(100), quantity: z.number().finite().min(0.000001), unitCost: z.number().finite().min(0) }).strict();
const statusSchema = z.object({ expectedStatus: z.enum(['PENDIENTE', 'APROBADA', 'RECIBIDA', 'CANCELADA']), status: z.enum(['PENDIENTE', 'APROBADA', 'RECIBIDA', 'CANCELADA']) }).strict();
function scope(req: Request): { companyId: string; branchId: string; userId: string } { const t = req.tenant; if (!t?.companyId || !t.branchId || !t.userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context missing', friendlyMessage: 'La sesion no tiene empresa y sucursal activas.', statusCode: 401 }); return { companyId: t.companyId, branchId: t.branchId, userId: t.userId }; }
export function createPurchaseOrderRoutes(): Router {
  const router = Router();
  router.get('/', authenticate, tenant, authorize('usuarios.ver'), async (req, res, next) => { try { const s = scope(req); res.json({ ok: true, data: await listPurchaseOrders(s.companyId, s.branchId) }); } catch (error) { next(error); } });
  router.get('/page', authenticate, tenant, authorize('usuarios.ver'), async (req, res, next) => { try { const s = scope(req); const query = parseCommercialQuery(req.query, 'purchase-orders'); res.json({ ok: true, data: await pagePurchaseOrders(s.companyId, s.branchId, query) }); } catch (error) { next(error); } });
  router.post('/', authenticate, tenant, authorize('usuarios.editar'), async (req, res, next) => { try { const s = scope(req); const parsed = schema.safeParse(req.body); if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid purchase order data', friendlyMessage: 'Revisa proveedor, producto, cantidad y costo unitario.', statusCode: 400 }); const row = await createAuditedPurchaseOrder({ ...parsed.data, companyId: s.companyId, branchId: s.branchId }, { userId: s.userId, ipAddress: req.ip }); res.status(201).json({ ok: true, data: row }); } catch (error) { next(error); } });
  router.patch('/:id/status', authenticate, tenant, authorize('usuarios.editar'), async (req, res, next) => {
    try {
      const s = scope(req); const parsed = statusSchema.safeParse(req.body);
      if (!parsed.success || !/^[a-f0-9]{24}$/i.test(req.params.id)) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid status payload', friendlyMessage: 'Revisa el estado del registro.', statusCode: 400 });
      const row = await updateAuditedPurchaseOrderStatus(req.params.id, s.companyId, s.branchId, parsed.data.expectedStatus, parsed.data.status, { userId: s.userId, ipAddress: req.ip });
      res.json({ ok: true, data: row });
    } catch (error) { next(error); }
  });
  return router;
}