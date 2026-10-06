import mongoose from 'mongoose';
import { AppError } from '../../errors/AppError.js';
import { getUserModel } from './models/User.js';
import { getAuditEventModel } from '../auditoria/models/AuditEvent.js';
import { findAssignableRole } from '../roles/roleService.js';

export type UserAccessInput = {
  id: string; companyId: string; branchId: string;
  expected: { roleId: string; isActive: boolean; permissions: string[] };
  change: { isActive: boolean } | { roleId: string };
};

export async function updateUserAccess(input: UserAccessInput, actor: { userId: string; permissions: string[]; ipAddress?: string }) {
  const invalid = () => new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid user access change', friendlyMessage: 'Revisa el usuario y el cambio de acceso.', statusCode: 400 });
  if (!actor.userId?.trim()) throw new AppError({ code: 'UNAUTHORIZED', message: 'Missing actor', friendlyMessage: 'Inicia sesión de nuevo.', statusCode: 401 });
  if (!/^[a-f0-9]{24}$/i.test(input.id) || input.id === actor.userId) throw invalid();
  const actorPermissions = new Set(actor.permissions);
  const role = 'roleId' in input.change ? await findAssignableRole(input.change.roleId, input.companyId) : null;
  if (role?.permissions.some(p => !actorPermissions.has(p)) || input.expected.permissions.some(p => !actorPermissions.has(p))) {
    throw new AppError({ code: 'FORBIDDEN', message: 'Cannot manage higher permissions', friendlyMessage: 'No puedes administrar una cuenta o asignar un rol con permisos superiores a los tuyos.', statusCode: 403 });
  }
  const change = role ? { roleId: role.id, permissions: role.permissions } : { isActive: (input.change as { isActive: boolean }).isActive };
  if (role ? role.id === input.expected.roleId && JSON.stringify([...role.permissions].sort()) === JSON.stringify([...input.expected.permissions].sort()) : change.isActive === input.expected.isActive) throw invalid();
  await Promise.all([getUserModel().init(), getAuditEventModel().init()]);
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      if(role){const fresh=await findAssignableRole(role.id,input.companyId,session);if(fresh.permissions.some(p=>!actorPermissions.has(p)))throw new AppError({code:'FORBIDDEN',message:'Role grants changed',friendlyMessage:'El rol cambió. Actualiza antes de asignarlo.',statusCode:403});change.permissions=fresh.permissions;}
      const row = await getUserModel().findOneAndUpdate({ _id: input.id, companyId: input.companyId, branchId: input.branchId, roleId: input.expected.roleId, isActive: input.expected.isActive, permissions: input.expected.permissions }, { $set: change, $inc: { sessionVersion: 1 } }, { new: true, runValidators: true, session })
        .select('email name companyId branchId roleId permissions isActive lastLoginAt createdAt updatedAt').lean().exec();
      if (!row) throw new AppError({ code: 'CONFLICT', message: 'User access changed', friendlyMessage: 'El acceso del usuario cambió. Actualiza la lista antes de reintentar.', statusCode: 409 });
      await getAuditEventModel().create([{ userId: actor.userId, companyId: input.companyId, branchId: input.branchId, action: 'UPDATE', module: 'usuarios', entityId: input.id, details: role ? { fields: ['roleId', 'permissions'], previousRoleId: input.expected.roleId, roleId: role.id, sessionsRevoked: true } : { fields: ['isActive'], isActive: row.isActive, sessionsRevoked: true }, ipAddress: actor.ipAddress }], { session });
      const { _id, ...values } = row;
      result = { id: String(_id), ...values };
    });
    return result!;
  } finally { await session.endSession(); }
}
