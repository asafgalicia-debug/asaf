import { expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ filter: undefined as unknown, projection: '', limit: 0, rows: [] as any[] }));
vi.mock('../src/modules/usuarios/models/User.js', () => ({ getUserModel: () => ({ find: (filter: unknown) => {
  state.filter = filter;
  const q: any = { select: (s: string) => { state.projection = s; return q; }, sort: () => q, limit: (n: number) => { state.limit = n; return q; }, lean: () => q, exec: async () => state.rows };
  return q;
} }) }));
import { parseUserPageQuery } from '../src/modules/usuarios/userPagination.js';
import { pageUsersForTenantMongo } from '../src/modules/usuarios/userRepositoryMongo.js';

it('rejects caller scope, unknown fields and unbounded or invalid pages', () => {
  expect(parseUserPageQuery({})).toEqual({ search: '', limit: 20 });
  for (const query of [{ companyId: 'other' }, { branchId: 'other' }, { permissions: 'admin' }, { limit: 51 }, { limit: 0 }, { cursor: 'invalid' }, { status: 'DELETED' }, { search: ['x'] }]) {
    expect(() => parseUserPageQuery(query)).toThrow();
  }
});

it('uses session scope, literal search, active state and bounded cursor pages without secrets', async () => {
  const ids = ['000000000000000000000003', '000000000000000000000002', '000000000000000000000001'];
  state.rows = ids.map(_id => ({ _id, name: 'A+B', isActive: false }));
  const page = await pageUsersForTenantMongo('company', 'branch', { search: 'A+B', status: 'INACTIVE', cursor: '000000000000000000000004', limit: 2 });
  expect(state.filter).toEqual({ companyId: 'company', branchId: 'branch', isActive: false, _id: { $lt: '000000000000000000000004' }, $or: [{ name: { $regex: 'A\\+B', $options: 'i' } }, { email: { $regex: 'A\\+B', $options: 'i' } }] });
  expect(state.limit).toBe(3);
  expect(page.items).toHaveLength(2);
  expect(page.nextCursor).toBe(ids[1]);
  expect(state.projection.split(' ')).toEqual(['email', 'name', 'companyId', 'branchId', 'roleId', 'permissions', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt']);
});
