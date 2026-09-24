import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { logAuditEvent } from '../../audit/auditLogger.js';
import { createCustomer, listCustomers } from './customerService.js';

const partnerSchema = z.object({ name: z.string().trim().min(2).max(120), taxId: z.string().trim().min(3).max(32), email: z.string().trim().email().max(254) }).strict();
function tenantOf(req: Request): { companyId: string; branchId: string; userId: string } {
  const value = req.tenant;
  if (!value?.companyId || !value.branchId || !value.userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context missing', friendlyMessage: 'La sesion no tiene empresa y sucursal activas.', statusCode: 401 });
  return { companyId: value.companyId, branchId: value.branchId, userId: value.userId };
}

export function createCustomerRoutes(): Router {
  const router = Router();
  router.get('/', authenticate, tenant, authorize('usuarios.ver'), async (req, res, next) => {
    try { const scope = tenantOf(req); res.json({ ok: true, data: await listCustomers(scope.companyId, scope.branchId) }); }
    catch (error) { next(error); }
  });
  router.post('/', authenticate, tenant, authorize('usuarios.editar'), async (req, res, next) => {
    try {
      const scope = tenantOf(req); const parsed = partnerSchema.safeParse(req.body);
      if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid customer data', friendlyMessage: 'Revisa nombre, identificador fiscal y correo del cliente.', statusCode: 400 });
      const created = await createCustomer({ ...parsed.data, companyId: scope.companyId, branchId: scope.branchId });
      await logAuditEvent({ userId: scope.userId, companyId: scope.companyId, branchId: scope.branchId, action: 'CREATE', module: 'clientes', entityId: created.id, details: {}, ipAddress: req.ip });
      res.status(201).json({ ok: true, data: created });
    } catch (error) { next(error); }
  });
  return router;
}