import { getUserModel } from './models/User.js';
import { AppError } from '../../errors/AppError.js';
import { hashPassword } from '../../security/password.js';
import { findAssignableRole } from '../roles/roleService.js';
import { catalogFilter, catalogSlice } from '../../core/catalogPagination.js';
import type { UserPageQuery } from './userPagination.js';
import mongoose, { type ClientSession } from 'mongoose';
import { getAuditEventModel } from '../auditoria/models/AuditEvent.js';

export async function pageUsersForTenantMongo(companyId: string, branchId: string, query: UserPageQuery) {
  const filter = catalogFilter({ companyId, branchId }, { search: query.search, cursor: query.cursor, limit: query.limit }, ['name', 'email']);
  if (query.status) filter.isActive = query.status === 'ACTIVE';
  // Explicit projection keeps credentials and verification tokens out of this directory.
  const rows = await getUserModel().find(filter)
    .select('email name companyId branchId roleId permissions isActive lastLoginAt createdAt updatedAt')
    .sort({ _id: -1 }).limit(query.limit + 1).lean().exec();
  return catalogSlice(rows, query.limit);
}

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
  sessionVersion?: number;
};

export async function findUserByEmailMongo(email: string): Promise<MongoAuthUser | null> {
  const User = getUserModel();
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash +sessionVersion').lean().exec();
  if (!user) return null;
  return { id: String(user._id), email: user.email, passwordHash: user.passwordHash, name: user.name, companyId: user.companyId, branchId: user.branchId, roleId: user.roleId, permissions: user.permissions, isActive: user.isActive, sessionVersion: user.sessionVersion ?? 0 };
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

export async function createUserInMongo(input: UserCreateInput, session?: ClientSession): Promise<Record<string, unknown>> {
  const User = getUserModel();
  const email = input.email.trim().toLowerCase();
  const role = await findAssignableRole(input.roleId, input.companyId, session);
  const actorPermissions = new Set(input.actorPermissions);
  if (role.permissions.some((permission) => !actorPermissions.has(permission))) {
    throw new AppError({ code: 'FORBIDDEN', message: 'El actor intentÃ³ asignar un rol con permisos superiores', friendlyMessage: 'No puedes asignar un rol con permisos que no tienes.', statusCode: 403 });
  }
  const passwordHash = await hashPassword(input.password);
  try {
    const [user] = await User.create([{ name: input.name.trim(), email, passwordHash, companyId: input.companyId, branchId: input.branchId, roleId: role.id, permissions: role.permissions, isActive: true }], { session });
    return { id: String(user._id), name: user.name, email: user.email, companyId: user.companyId, branchId: user.branchId, roleId: user.roleId, permissions: user.permissions, isActive: user.isActive, createdAt: user.createdAt };
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'code' in error && (error as { code?: number }).code === 11000) {
      throw new AppError({ code: 'CONFLICT', message: 'El email ya estÃ¡ registrado', friendlyMessage: 'Ya existe un usuario con ese correo electrÃ³nico.', statusCode: 409 });
    }
    throw error;
  }
}

export async function createAuditedUserInMongo(input: UserCreateInput, actor: { userId: string; ipAddress?: string }): Promise<Record<string, unknown>> {
  if (!actor.userId?.trim()) throw new AppError({ code: 'UNAUTHORIZED', message: 'Missing user creation actor', friendlyMessage: 'Inicia sesión de nuevo.', statusCode: 401 });
  await Promise.all([getUserModel().init(), getAuditEventModel().init()]);
  const session = await mongoose.startSession();
  let created: Record<string, unknown> | undefined;
  try {
    await session.withTransaction(async () => {
      created = await createUserInMongo(input, session);
      await getAuditEventModel().create([{ userId: actor.userId, companyId: input.companyId, branchId: input.branchId, action: 'CREATE', module: 'usuarios', entityId: String(created.id), details: { roleId: String(created.roleId) }, ipAddress: actor.ipAddress }], { session });
    });
    return created!;
  } finally { await session.endSession(); }
}

export async function renameAuditedUser(input: { id: string; companyId: string; branchId: string; name: string; expectedName: string }, actor: { userId: string; ipAddress?: string }) {
  if (!actor.userId?.trim()) throw new AppError({ code: 'UNAUTHORIZED', message: 'Missing actor', friendlyMessage: 'Inicia sesión de nuevo.', statusCode: 401 });
  const name = input.name.trim();
  if (!/^[a-f0-9]{24}$/i.test(input.id) || name.length < 2 || name.length > 100 || name === input.expectedName) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid user rename', friendlyMessage: 'Indica un nombre distinto de entre 2 y 100 caracteres.', statusCode: 400 });
  await Promise.all([getUserModel().init(), getAuditEventModel().init()]);
  const session = await mongoose.startSession();
  let result;
  try {
    await session.withTransaction(async () => {
      const row = await getUserModel().findOneAndUpdate({ _id: input.id, companyId: input.companyId, branchId: input.branchId, name: input.expectedName }, { $set: { name } }, { new: true, runValidators: true, session })
        .select('email name companyId branchId roleId permissions isActive lastLoginAt createdAt updatedAt').lean().exec();
      if (!row) throw new AppError({ code: 'CONFLICT', message: 'User changed or missing', friendlyMessage: 'El usuario cambió o ya no está disponible. Actualiza la lista.', statusCode: 409 });
      await getAuditEventModel().create([{ userId: actor.userId, companyId: input.companyId, branchId: input.branchId, action: 'UPDATE', module: 'usuarios', entityId: input.id, details: { fields: ['name'] }, ipAddress: actor.ipAddress }], { session });
      const { _id, ...values } = row;
      result = { id: String(_id), ...values };
    });
    return result!;
  } finally { await session.endSession(); }
}
