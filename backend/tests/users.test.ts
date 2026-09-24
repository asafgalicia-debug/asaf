import { describe, expect, it } from 'vitest';

import { AppError } from '../src/errors/AppError.js';
import {
  createUser,
  listUsers,
  seedUsers
} from '../src/modules/usuarios/userService.js';

describe('usuarios module', () => {
  it('should list seeded users', () => {
    seedUsers();
    const users = listUsers('company-demo-01');

    expect(users.length).toBeGreaterThan(0);
    expect(users[0].email).toBe('admin@erp.local');
  });

  it('should create a user with valid data', () => {
    seedUsers();
    const user = createUser({
      name: 'Ana López',
      email: 'ana@erp.local',
      roleId: 'role-ventas-demo',
      companyId: 'company-demo-01',
      branchId: 'branch-demo-01'
    });

    expect(user.email).toBe('ana@erp.local');
    expect(user.permissions).toContain('usuarios.ver');
  });

  it('should reject invalid user payloads', () => {
    expect(() =>
      createUser({
        name: '',
        email: 'invalid',
        roleId: '',
        companyId: 'company-demo-01',
        branchId: 'branch-demo-01'
      })
    ).toThrow(AppError);
  });
});
