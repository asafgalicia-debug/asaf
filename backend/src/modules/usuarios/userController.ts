import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { logAuditEvent } from '../../audit/auditLogger.js';
import { createUserInMongo, listUsersForTenantMongo } from './userRepositoryMongo.js';

const createUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(72).refine((value) => Buffer.byteLength(value, 'utf8') <= 72),
  roleId: z.string().trim().min(1).max(100)
}).strict();

function requireTenant(req: Request): { companyId: string; branchId: string } {
  const companyId = req.tenant?.companyId;
  const branchId = req.tenant?.branchId;
  if (typeof companyId !== 'string' || !companyId.trim() || typeof branchId !== 'string' || !branchId.trim()) {
    throw new AppError({ code: 'UNAUTHORIZED', message: 'Incomplete tenant context', friendlyMessage: 'La sesion no tiene empresa y sucursal activas.', statusCode: 401 });
  }
  return { companyId, branchId };
}

export async function listUsersController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantContext = requireTenant(req);
    res.json({ ok: true, data: await listUsersForTenantMongo(tenantContext.companyId, tenantContext.branchId) });
  } catch (error) { next(error); }
}

export async function createUserController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const tenantContext = requireTenant(req);
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid user data', friendlyMessage: 'Verifica nombre, email, contrasena de al menos 12 caracteres y rol.', statusCode: 400 });
    const created = await createUserInMongo({ ...parsed.data, ...tenantContext, actorPermissions: req.user?.permissions ?? [] });
    await logAuditEvent({ userId: req.user?.id ?? '', ...tenantContext, action: 'CREATE', module: 'usuarios', entityId: String(created.id), details: { roleId: String(created.roleId) }, ipAddress: req.ip });
    res.status(201).json({ ok: true, data: created });
  } catch (error) { next(error); }
}

export function usersHealthController(_req: Request, res: Response): void {
  res.json({ ok: true, data: { module: 'usuarios', status: 'active' } });
}