import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { logAuditEvent } from '../../audit/auditLogger.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createEmployee, listEmployees } from './employeeService.js';
const schema = z.object({ departmentId: z.string().trim().min(1).max(100), userId: z.string().trim().min(1).max(100), fullName: z.string().trim().min(2).max(120), position: z.string().trim().min(2).max(100) }).strict();
function scope(req: Request): { companyId: string; branchId: string; userId: string } { const t = req.tenant; if (!t?.companyId || !t.branchId || !t.userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context missing', friendlyMessage: 'La sesion no tiene empresa y sucursal activas.', statusCode: 401 }); return { companyId: t.companyId, branchId: t.branchId, userId: t.userId }; }
export function createEmployeeRoutes(): Router {
  const router = Router();
  router.get('/', authenticate, tenant, authorize('rrhh.ver'), async (req, res, next) => { try { const s = scope(req); res.json({ ok: true, data: await listEmployees(s.companyId, s.branchId) }); } catch (error) { next(error); } });
  router.post('/', authenticate, tenant, authorize('rrhh.crear'), async (req, res, next) => { try { const s = scope(req); const parsed = schema.safeParse(req.body); if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid employee data', friendlyMessage: 'Revisa departamento, usuario, nombre y puesto.', statusCode: 400 }); const row = await createEmployee({ ...parsed.data, companyId: s.companyId, branchId: s.branchId }); await logAuditEvent({ userId: s.userId, companyId: s.companyId, branchId: s.branchId, action: 'CREATE', module: 'rrhh', entityId: row.id, details: { departmentId: row.departmentId }, ipAddress: req.ip }); res.status(201).json({ ok: true, data: row }); } catch (error) { next(error); } });
  return router;
}