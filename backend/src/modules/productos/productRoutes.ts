import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { logAuditEvent } from '../../audit/auditLogger.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createProduct, listProducts } from './productService.js';
const productSchema = z.object({ categoryId: z.string().trim().min(1).max(100), name: z.string().trim().min(2).max(120), sku: z.string().trim().min(1).max(48), price: z.number().finite().min(0) }).strict();
function scope(req: Request): { companyId: string; branchId: string; userId: string } {
  const value = req.tenant;
  if (!value?.companyId || !value.branchId || !value.userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context missing', friendlyMessage: 'La sesion no tiene empresa y sucursal activas.', statusCode: 401 });
  return { companyId: value.companyId, branchId: value.branchId, userId: value.userId };
}
export function createProductRoutes(): Router {
  const router = Router();
  router.get('/', authenticate, tenant, authorize('usuarios.ver'), async (req, res, next) => { try { const s = scope(req); res.json({ ok: true, data: await listProducts(s.companyId) }); } catch (error) { next(error); } });
  router.post('/', authenticate, tenant, authorize('usuarios.editar'), async (req, res, next) => {
    try {
      const s = scope(req); const parsed = productSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid product data', friendlyMessage: 'Revisa categoria, nombre, SKU y precio del producto.', statusCode: 400 });
      const created = await createProduct({ ...parsed.data, companyId: s.companyId });
      await logAuditEvent({ userId: s.userId, companyId: s.companyId, branchId: s.branchId, action: 'CREATE', module: 'productos', entityId: created.id, details: { sku: created.sku }, ipAddress: req.ip });
      res.status(201).json({ ok: true, data: created });
    } catch (error) { next(error); }
  });
  return router;
}