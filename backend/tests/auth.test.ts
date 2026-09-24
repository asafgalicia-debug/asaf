import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.JWT_SECRET ||= 'test-only-secret-that-is-at-least-64-characters-long-0123456789abcdef';
});

import { AppError } from '../src/errors/AppError.js';
import { authenticateCredentials, type AuthRepository } from '../src/modules/auth/authService.js';
import { hashPassword } from '../src/security/password.js';
import type { MongoAuthUser } from '../src/modules/usuarios/userRepositoryMongo.js';

describe('auth service', () => {
  let user: MongoAuthUser;
  let repository: AuthRepository;

  beforeEach(async () => {
    user = {
      id: 'user-test-01',
      email: 'admin@erp.local',
      passwordHash: await hashPassword('Admin123!'),
      name: 'Administrador de prueba',
      companyId: 'company-test-01',
      branchId: 'branch-test-01',
      roleId: 'role-admin-test',
      permissions: ['auth.profile', 'usuarios.ver'],
      isActive: true
    };
    repository = {
      findByEmail: vi.fn(async (email: string) => email === user.email ? user : null),
      updateLastLogin: vi.fn(async () => undefined)
    };
  });

  it('authenticates an active Mongo user and updates last login', async () => {
    const result = await authenticateCredentials({ email: ' ADMIN@ERP.LOCAL ', password: 'Admin123!' }, repository);

    expect(result.token).toBeTypeOf('string');
    expect(result.user.id).toBe(user.id);
    expect(result.user.email).toBe(user.email);
    expect(result.user.permissions).toContain('usuarios.ver');
    expect(repository.updateLastLogin).toHaveBeenCalledOnce();
  });

  it('rejects invalid credentials without revealing whether the user exists', async () => {
    await expect(authenticateCredentials({ email: user.email, password: 'wrong-password' }, repository)).rejects.toMatchObject({ statusCode: 401 });
    await expect(authenticateCredentials({ email: 'missing@erp.local', password: 'wrong-password' }, repository)).rejects.toThrow(AppError);
  });

  it('rejects inactive users', async () => {
    user.isActive = false;
    await expect(authenticateCredentials({ email: user.email, password: 'Admin123!' }, repository)).rejects.toMatchObject({ statusCode: 401 });
  });
});