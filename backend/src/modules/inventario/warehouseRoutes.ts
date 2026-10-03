import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { logAuditEvent } from '../../audit/auditLogger.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createWarehouse, listWarehouses, renameWarehouse } from './warehouseService.js';
const schema = z.object({ name: z.string().trim().min(2).max(100), code: z.string().trim().min(2).max(32) }).strict();
const renameSchema = z.object({ name: z.string().trim().min(2).max(100), expectedName: z.string().trim().min(2).max(100) }).strict();
function scope(req: Request): { companyId: string; branchId: string; userId: string } { const t = req.tenant; if (!t?.companyId || !t.branchId || !t.userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context missing', friendlyMessage: 'La sesion no tiene empresa y sucursal activas.', statusCode: 401 }); return { companyId: t.companyId, branchId: t.branchId, userId: t.userId }; }
export function createWarehouseRoutes(): Router {
  const router = Router();
  router.get('/', authenticate, tenant, authorize('usuarios.ver'), async (req, res, next) => { try { const s = scope(req); res.json({ ok: true, data: await listWarehouses(s.companyId, s.branchId) }); } catch (error) { next(error); } });
  router.post('/', authenticate, tenant, authorize('usuarios.editar'), async (req, res, next) => { try { const s = scope(req); const parsed = schema.safeParse(req.body); if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid warehouse data', friendlyMessage: 'Revisa nombre y codigo del almacen.', statusCode: 400 }); const row = await createWarehouse({ ...parsed.data, companyId: s.companyId, branchId: s.branchId }); await logAuditEvent({ userId: s.userId, companyId: s.companyId, branchId: s.branchId, action: 'CREATE', module: 'inventario', entityId: row.id, details: { type: 'warehouse' }, ipAddress: req.ip }); res.status(201).json({ ok: true, data: row }); } catch (error) { next(error); } });
  router.patch('/:id', authenticate, tenant, authorize('usuarios.editar'), async (req, res, next) => {
    try {
      const s = scope(req); const parsed = renameSchema.safeParse(req.body);
      if (!parsed.success || !/^[a-f0-9]{24}$/i.test(req.params.id)) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid rename payload', friendlyMessage: 'Revisa el nombre del registro.', statusCode: 400 });
      const row = await renameWarehouse(req.params.id, s.companyId, s.branchId, parsed.data.expectedName, parsed.data.name);
      await logAuditEvent({ userId: s.userId, companyId: s.companyId, branchId: s.branchId, action: 'UPDATE', module: 'inventario', entityId: row.id, details: { fields: ['name'] }, ipAddress: req.ip });
      res.json({ ok: true, data: row });
    } catch (error) { next(error); }
  });
  return router;
}