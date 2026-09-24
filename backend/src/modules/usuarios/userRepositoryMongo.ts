import { getUserModel } from './models/User.js';
import { AppError } from '../../errors/AppError.js';
import { hashPassword } from '../../security/password.js';
import { findAssignableRole } from '../roles/roleService.js';

export type MongoAuthUser = {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  companyId: string;
  branchId: string;
  roleId: string;
  permissions: string[];
  isActive: boolean;
};

export async function findUserByEmailMongo(email: string): Promise<MongoAuthUser | null> {
  const User = getUserModel();
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash').lean().exec();
  if (!user) return null;
  return { id: String(user._id), email: user.email, passwordHash: user.passwordHash, name: user.name, companyId: user.companyId, branchId: user.branchId, roleId: user.roleId, permissions: user.permissions, isActive: user.isActive };
}

export async function updateUserLastLoginMongo(userId: string, at: Date): Promise<void> {
  const User = getUserModel();
  await User.updateOne({ _id: userId }, { $set: { lastLoginAt: at } }).exec();
}

export type UserCreateInput = { name: string; email: string; password: string; roleId: string; companyId: string; branchId: string; actorPermissions: string[] };

export async function listUsersForTenantMongo(companyId: string, branchId: string): Promise<Array<Record<string, unknown>>> {
  const User = getUserModel();
  const users = await User.find({ companyId, branchId }).select('email name companyId branchId roleId permissions isActive lastLoginAt createdAt updatedAt').sort({ name: 1 }).lean().exec();
  return users.map(({ _id, ...user }) => ({ id: String(_id), ...user }));
}

export async function createUserInMongo(input: UserCreateInput): Promise<Record<string, unknown>> {
  const User = getUserModel();
  const email = input.email.trim().toLowerCase();
  const role = await findAssignableRole(input.roleId, input.companyId);
  const actorPermissions = new Set(input.actorPermissions);
  if (role.permissions.some((permission) => !actorPermissions.has(permission))) {
    throw new AppError({ code: 'FORBIDDEN', message: 'El actor intentÃ³ asignar un rol con permisos superiores', friendlyMessage: 'No puedes asignar un rol con permisos que no tienes.', statusCode: 403 });
  }
  const passwordHash = await hashPassword(input.password);
  try {
    const user = await User.create({ name: input.name.trim(), email, passwordHash, companyId: input.companyId, branchId: input.branchId, roleId: role.id, permissions: role.permissions, isActive: true });
    return { id: String(user._id), name: user.name, email: user.email, companyId: user.companyId, branchId: user.branchId, roleId: user.roleId, permissions: user.permissions, isActive: user.isActive, createdAt: user.createdAt };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000) {
      throw new AppError({ code: 'CONFLICT', message: 'El email ya estÃ¡ registrado', friendlyMessage: 'Ya existe un usuario con ese correo electrÃ³nico.', statusCode: 409 });
    }
    throw error;
  }
}