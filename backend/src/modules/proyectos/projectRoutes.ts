import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { logAuditEvent } from '../../audit/auditLogger.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createProject, listProjects } from './projectService.js';
const schema = z.object({ customerId: z.string().trim().min(1).max(100), name: z.string().trim().min(2).max(120), startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/) }).strict();
function scope(req: Request): { companyId: string; branchId: string; userId: string } { const t = req.tenant; if (!t?.companyId || !t.branchId || !t.userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context missing', friendlyMessage: 'La sesion no tiene empresa y sucursal activas.', statusCode: 401 }); return { companyId: t.companyId, branchId: t.branchId, userId: t.userId }; }
export function createProjectRoutes(): Router {
  const router = Router();
  router.get('/', authenticate, tenant, authorize('proyectos.ver'), async (req, res, next) => { try { const s = scope(req); res.json({ ok: true, data: await listProjects(s.companyId, s.branchId) }); } catch (error) { next(error); } });
  router.post('/', authenticate, tenant, authorize('proyectos.crear'), async (req, res, next) => { try { const s = scope(req); const parsed = schema.safeParse(req.body); if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid project payload', friendlyMessage: 'Revisa cliente, nombre y fechas del proyecto.', statusCode: 400 }); const row = await createProject({ ...parsed.data, companyId: s.companyId, branchId: s.branchId }); await logAuditEvent({ userId: s.userId, companyId: s.companyId, branchId: s.branchId, action: 'CREATE', module: 'proyectos', entityId: row.id, details: { customerId: row.customerId }, ipAddress: req.ip }); res.status(201).json({ ok: true, data: row }); } catch (error) { next(error); } });
  return router;
}