import mongoose from 'mongoose';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { getAuditEventModel } from '../auditoria/models/AuditEvent.js';
import { getUserModel } from '../usuarios/models/User.js';
import { getRoleModel } from './models/Role.js';

const statusSchema = z.object({
  isActive: z.boolean(),
  expectedUpdatedAt: z.string().datetime()
}).strict();

export async function changeRoleStatus(
  scope: { companyId: string; branchId: string; userId: string; permissions: string[]; ipAddress?: string },
  roleId: string,
  payload: unknown
) {
  if (!scope.companyId?.trim() || !scope.branchId?.trim() || !/^[a-f0-9]{24}$/i.test(scope.userId)) {
    throw new AppError({ code: 'UNAUTHORIZED', message: 'Missing role actor', friendlyMessage: 'Inicia sesión de nuevo.', statusCode: 401 });
  }
  const parsed = statusSchema.safeParse(payload);
  if (!parsed.success || !/^[a-f0-9]{24}$/i.test(roleId)) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid role status', friendlyMessage: 'Actualiza el rol y revisa el cambio de estado.', statusCode: 400 });
  }
  const Role = getRoleModel();
  const User = getUserModel();
  const Audit = getAuditEventModel();
  await Promise.all([Role.init(), User.init(), Audit.init()]);
  const session = await mongoose.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const current = await Role.findOne({ _id: roleId, companyId: scope.companyId, isSystem: false, updatedAt: new Date(parsed.data.expectedUpdatedAt) }).session(session).lean();
      if (!current) throw new AppError({ code: 'CONFLICT', message: 'Role changed', friendlyMessage: 'El rol cambió. Actualiza antes de reintentar.', statusCode: 409 });
      if (current.permissions.some(permission => !scope.permissions.includes(permission))) {
        throw new AppError({ code: 'FORBIDDEN', message: 'Protected role', friendlyMessage: 'No puedes administrar un rol con permisos superiores.', statusCode: 403 });
      }
      if ((current.isActive !== false) === parsed.data.isActive) {
        throw new AppError({ code: 'VALIDATION_ERROR', message: 'Unchanged role status', friendlyMessage: 'El rol ya tiene ese estado.', statusCode: 400 });
      }
      // Assignments lock this same role document inside their transaction.
      // The write makes concurrent assignment and deactivation retry together.
      const updated = await Role.findOneAndUpdate({ _id: roleId, companyId: scope.companyId, isSystem: false, updatedAt: current.updatedAt }, {
        $set: { isActive: parsed.data.isActive, updatedAt: new Date(Math.max(Date.now(), current.updatedAt.getTime() + 1)) },
        $inc: { __v: 1 }
      }, { new: true, session, timestamps: false }).lean();
      if (!updated) throw new AppError({ code: 'CONFLICT', message: 'Role changed', friendlyMessage: 'Actualiza el rol antes de reintentar.', statusCode: 409 });
      if (!parsed.data.isActive && await User.exists({ companyId: scope.companyId, roleId }).session(session)) {
        throw new AppError({ code: 'CONFLICT', message: 'Role has assigned users', friendlyMessage: 'Reasigna todos los usuarios de este rol, incluidos los inactivos y los de otras sucursales, antes de desactivarlo.', statusCode: 409 });
      }
      await Audit.create([{ userId: scope.userId, companyId: scope.companyId, branchId: scope.branchId, action: 'UPDATE', module: 'roles', entityId: roleId, details: { previousIsActive: current.isActive !== false, isActive: updated.isActive }, ipAddress: scope.ipAddress }], { session });
      result = { id: String(updated._id), name: updated.name, description: updated.description, permissions: updated.permissions, companyId: updated.companyId, isSystem: false, isActive: updated.isActive, updatedAt: updated.updatedAt.toISOString() };
    });
    return result!;
  } finally {
    await session.endSession();
  }
}
