import { describe, expect, it } from 'vitest';

import { buildDefaultRoleSeed, buildDefaultUserSeed } from '../src/config/seed.js';

describe('seed data', () => {
  it('should include the ERP default roles', () => {
    const roles = buildDefaultRoleSeed();

    expect(roles.some((role) => role.name === 'ADMIN')).toBe(true);
    expect(roles.some((role) => role.name === 'VENTAS')).toBe(true);
  });

  it('should include a default admin user seed', () => {
    const user = buildDefaultUserSeed();

    expect(user.email).toBe('admin@erp.local');
    expect(user.companyId).toBe('company-demo-01');
    expect(user.roleId).toBe('role-admin-demo');
  });
});
