import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { createAuditedUserInMongo, listUsersForTenantMongo, pageUsersForTenantMongo, renameAuditedUser } from './userRepositoryMongo.js';
import { parseUserPageQuery } from './userPagination.js';
import { updateUserAccess } from './userAccessService.js';

export async function updateUserAccessController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scope = requireTenant(req);
    const parsed = z.object({ expected: z.object({ roleId: z.string().min(1).max(100), isActive: z.boolean(), permissions: z.array(z.string().min(1).max(100)).max(100) }).strict(), change: z.union([z.object({ isActive: z.boolean() }).strict(), z.object({ roleId: z.string().trim().min(1).max(100) }).strict()]) }).strict().safeParse(req.body);
    if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid user access body', friendlyMessage: 'Revisa el cambio de acceso.', statusCode: 400 });
    const data = await updateUserAccess({ ...scope, ...parsed.data, id: String(req.params.id) }, { userId: req.user?.id ?? '', permissions: req.user?.permissions ?? [], ipAddress: req.ip });
    res.json({ ok: true, data });
  } catch (error) { next(error); }
}

export async function pageUsersController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scope = requireTenant(req);
    const query = parseUserPageQuery(req.query);
    res.json({ ok: true, data: await pageUsersForTenantMongo(scope.companyId, scope.branchId, query) });
  } catch (error) { next(error); }
}

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
    const created = await createAuditedUserInMongo({ ...parsed.data, ...tenantContext, actorPermissions: req.user?.permissions ?? [] }, { userId: req.user?.id ?? '', ipAddress: req.ip });
    res.status(201).json({ ok: true, data: created });
  } catch (error) { next(error); }
}

export function usersHealthController(_req: Request, res: Response): void {
  res.json({ ok: true, data: { module: 'usuarios', status: 'active' } });
}

export async function renameUserController(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const scope = requireTenant(req);
    const parsed = z.object({ name: z.string().trim().min(2).max(100), expectedName: z.string().min(2).max(100) }).strict().safeParse(req.body);
    if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid rename body', friendlyMessage: 'Revisa el nombre del usuario.', statusCode: 400 });
    const data = await renameAuditedUser({ ...scope, ...parsed.data, id: String(req.params.id) }, { userId: req.user?.id ?? '', ipAddress: req.ip });
    res.json({ ok: true, data });
  } catch (error) { next(error); }
}
