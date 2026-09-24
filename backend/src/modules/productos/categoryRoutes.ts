import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { logAuditEvent } from '../../audit/auditLogger.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createCategory, listCategories } from './categoryService.js';
const categorySchema = z.object({ name: z.string().trim().min(2).max(100), code: z.string().trim().min(2).max(24) }).strict();
function scope(req: Request): { companyId: string; branchId: string; userId: string } {
  const value = req.tenant;
  if (!value?.companyId || !value.branchId || !value.userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context missing', friendlyMessage: 'La sesion no tiene empresa y sucursal activas.', statusCode: 401 });
  return { companyId: value.companyId, branchId: value.branchId, userId: value.userId };
}
export function createCategoryRoutes(): Router {
  const router = Router();
  router.get('/', authenticate, tenant, authorize('usuarios.ver'), async (req, res, next) => { try { const s = scope(req); res.json({ ok: true, data: await listCategories(s.companyId) }); } catch (error) { next(error); } });
  router.post('/', authenticate, tenant, authorize('usuarios.editar'), async (req, res, next) => {
    try {
      const s = scope(req); const parsed = categorySchema.safeParse(req.body);
      if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid category data', friendlyMessage: 'Revisa nombre y codigo de la categoria.', statusCode: 400 });
      const created = await createCategory({ ...parsed.data, companyId: s.companyId });
      await logAuditEvent({ userId: s.userId, companyId: s.companyId, branchId: s.branchId, action: 'CREATE', module: 'categorias', entityId: created.id, details: {}, ipAddress: req.ip });
      res.status(201).json({ ok: true, data: created });
    } catch (error) { next(error); }
  });
  return router;
}