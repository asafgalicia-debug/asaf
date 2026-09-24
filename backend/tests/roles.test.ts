import { describe, expect, it } from 'vitest';

import { AppError } from '../src/errors/AppError.js';
import { createRole, listRoles, resolveRolePermissions } from '../src/modules/roles/roleService.js';

describe('roles module', () => {
  it('should expose default ERP roles', () => {
    const roles = listRoles();

    expect(roles.length).toBeGreaterThan(0);
    expect(roles[0].name).toBe('ADMIN');
  });

  it('should resolve permissions for a role', () => {
    const perms = resolveRolePermissions('VENTAS');

    expect(perms).toContain('usuarios.ver');
    expect(perms).toContain('auth.profile');
  });

  it('should reject invalid role creation', () => {
    expect(() =>
      createRole({
        name: '',
        description: 'Sin nombre',
        permissions: ['usuarios.ver']
      })
    ).toThrow(AppError);
  });
});
