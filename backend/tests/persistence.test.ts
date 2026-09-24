import { describe, expect, it } from 'vitest';

import { getUserModel } from '../src/modules/usuarios/models/User.js';
import { getRoleModel } from '../src/modules/roles/models/Role.js';

describe('persistence models', () => {
  it('should expose Mongoose models for users and roles', () => {
    expect(getUserModel).toBeTypeOf('function');
    expect(getRoleModel).toBeTypeOf('function');
  });

  it('should define the expected user and role fields', () => {
    const User = getUserModel();
    const Role = getRoleModel();

    expect(User.modelName).toBe('User');
    expect(Role.modelName).toBe('Role');
  });
});
