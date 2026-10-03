import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { logAuditEvent } from '../../audit/auditLogger.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createCategory, listCategories, renameCategory } from './categoryService.js';
const categorySchema = z.object({ name: z.string().trim().min(2).max(100), code: z.string().trim().min(2).max(24) }).strict();
const renameSchema = z.object({ name: z.string().trim().min(2).max(100), expectedName: z.string().trim().min(2).max(100) }).strict();
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
  router.patch('/:id', authenticate, tenant, authorize('usuarios.editar'), async (req, res, next) => {
    try {
      const s = scope(req); const parsed = renameSchema.safeParse(req.body);
      if (!parsed.success || !/^[a-f0-9]{24}$/i.test(req.params.id)) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid rename payload', friendlyMessage: 'Revisa el nombre del registro.', statusCode: 400 });
      const row = await renameCategory(req.params.id, s.companyId, parsed.data.expectedName, parsed.data.name);
      await logAuditEvent({ userId: s.userId, companyId: s.companyId, branchId: s.branchId, action: 'UPDATE', module: 'categorias', entityId: row.id, details: { fields: ['name'] }, ipAddress: req.ip });
      res.json({ ok: true, data: row });
    } catch (error) { next(error); }
  });
  return router;
}