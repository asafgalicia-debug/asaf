import { AppError } from '../../errors/AppError.js';
import { signToken } from '../../security/jwt.js';
import { verifyPassword } from '../../security/password.js';
import {
  findUserByEmailMongo,
  updateUserLastLoginMongo,
  type MongoAuthUser
} from '../usuarios/userRepositoryMongo.js';

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  companyId: string;
  branchId: string;
  roleId: string;
  permissions: string[];
};

export type AuthRepository = {
  findByEmail(email: string): Promise<MongoAuthUser | null>;
  updateLastLogin(userId: string, at: Date): Promise<void>;
};

const mongoRepository: AuthRepository = {
  findByEmail: findUserByEmailMongo,
  updateLastLogin: updateUserLastLoginMongo
};

function invalidCredentials(): AppError {
  return new AppError({
    code: 'UNAUTHORIZED',
    message: 'Credenciales invÃ¡lidas',
    friendlyMessage: 'El email o la contraseÃ±a son incorrectos.',
    statusCode: 401
  });
}

function temporarilyUnavailable(): AppError {
  return new AppError({
    code: 'INTERNAL',
    message: 'Servicio de autenticaciÃ³n no disponible',
    friendlyMessage: 'No se pudo iniciar sesiÃ³n temporalmente. IntÃ©ntalo de nuevo.',
    statusCode: 503
  });
}

export async function authenticateCredentials(
  input: LoginInput,
  repository: AuthRepository = mongoRepository
): Promise<{ token: string; user: AuthenticatedUser }> {
  let user: MongoAuthUser | null;
  try {
    user = await repository.findByEmail(input.email.trim().toLowerCase());
  } catch {
    throw temporarilyUnavailable();
  }

  if (!user || !user.isActive) throw invalidCredentials();

  let isValidPassword = false;
  try {
    isValidPassword = await verifyPassword(input.password, user.passwordHash);
  } catch {
    isValidPassword = false;
  }
  if (!isValidPassword) throw invalidCredentials();

  const safeUser: AuthenticatedUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    companyId: user.companyId,
    branchId: user.branchId,
    roleId: user.roleId,
    permissions: Array.isArray(user.permissions) ? user.permissions.filter((permission) => typeof permission === 'string') : []
  };

  try {
    await repository.updateLastLogin(user.id, new Date());
    const token = signToken({
      sub: safeUser.id,
      email: safeUser.email,
      companyId: safeUser.companyId,
      branchId: safeUser.branchId,
      roleId: safeUser.roleId,
      permissions: safeUser.permissions
    });
    return { token, user: safeUser };
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.message.includes('JWT_SECRET')) throw error;
    throw temporarilyUnavailable();
  }
}