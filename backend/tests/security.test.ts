import { describe, expect, it } from 'vitest';

import { hashPassword, verifyPassword } from '../src/security/password.js';

describe('security layer', () => {
  it('should hash a password and verify it correctly', async () => {
    const password = 'Admin123!';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    await expect(verifyPassword(password, hash)).resolves.toBe(true);
  });

  it('should reject a wrong password', async () => {
    const hash = await hashPassword('Admin123!');
    await expect(verifyPassword('WrongPass1!', hash)).resolves.toBe(false);
  });
});
