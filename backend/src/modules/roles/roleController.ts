import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { logAuditEvent } from '../../audit/auditLogger.js';
import { createRoleForCompany, findAssignableRole, listRolesForCompany } from './roleService.js';

const createRoleSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().min(2).max(250),
  permissions: z.array(z.string().trim().min(3).max(100)).min(1).max(100)
}).strict();

function requireCompanyId(req: Request): string {
  const companyId = req.tenant?.companyId;
  if (typeof companyId !== 'string' || !companyId.trim()) throw new AppError({ code: 'UNAUTHORIZED', message: 'Company context missing', friendlyMessage: 'La sesion no tiene una empresa activa.', statusCode: 401 });
  return companyId;
}

export async function listRolesController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { res.json({ ok: true, data: await listRolesForCompany(requireCompanyId(req)) }); }
  catch (error) { next(error); }
}

export async function resolveRoleController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const role = await findAssignableRole(String(req.params.roleName ?? ''), requireCompanyId(req));
    res.json({ ok: true, data: role.permissions });
  } catch (error) { next(error); }
}

export async function createRoleController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const companyId = requireCompanyId(req);
    const branchId = req.tenant?.branchId;
    const userId = req.user?.id;
    if (typeof branchId !== 'string' || !branchId.trim() || !userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Incomplete actor context', friendlyMessage: 'La sesion no tiene empresa, sucursal y usuario activos.', statusCode: 401 });
    const parsed = createRoleSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid role data', friendlyMessage: 'Verifica el nombre, la descripcion y los permisos del rol.', statusCode: 400 });
    const actorPermissions = new Set(req.user?.permissions ?? []);
    if (parsed.data.permissions.some((permission) => !actorPermissions.has(permission))) throw new AppError({ code: 'FORBIDDEN', message: 'Attempt to grant permissions not held by actor', friendlyMessage: 'Solo puedes asignar permisos que ya tienes.', statusCode: 403 });
    const created = await createRoleForCompany(companyId, parsed.data);
    await logAuditEvent({ userId, companyId, branchId, action: 'CREATE', module: 'roles', entityId: created.id, details: { roleName: created.name, permissionCount: created.permissions.length }, ipAddress: req.ip });
    res.status(201).json({ ok: true, data: created });
  } catch (error) { next(error); }
}