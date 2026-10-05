import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ rows: [] as Array<Record<string, unknown>> }));
type DepartmentQuery = { sort: () => DepartmentQuery; lean: () => DepartmentQuery; exec: () => Promise<Array<Record<string, unknown>>> };

vi.mock('../src/modules/empresas/models/Branch.js', () => ({
  getBranchModel: () => ({ exists: (filter: { _id: string; companyId: string; isActive: boolean }) => ({session:async()=>filter._id === 'branch-test-01' && filter.companyId === 'company-test-01' && filter.isActive}) })
}));

vi.mock('../src/modules/empresas/models/Department.js', () => ({
  getDepartmentModel: () => ({
    find: (filter: { companyId: string; branchId: string }) => {
      const query: DepartmentQuery = { sort: () => query, lean: () => query, exec: async () => state.rows.filter((row) => row.companyId === filter.companyId && row.branchId === filter.branchId) };
      return query;
    },
    create: async (input: Record<string, unknown>) => {
      const row = { ...input, createdAt: new Date(), updatedAt: new Date() };
      state.rows.push(row);
      return { toObject: () => row };
    }
  })
}));

import { createDepartment, listDepartments } from '../src/modules/empresas/departmentService.js';

describe('department domain', () => {
  beforeEach(() => { state.rows.length = 0; });

  it('persists departments and scopes listing by company and branch', async () => {
    const department = await createDepartment({ companyId: 'company-test-01', branchId: 'branch-test-01', name: 'Finanzas', code: 'FIN' });
    expect(department.name).toBe('Finanzas');
    expect(await listDepartments('company-test-01', 'branch-test-01')).toHaveLength(1);
    expect(await listDepartments('company-other', 'branch-test-01')).toHaveLength(0);
  });

  it('rejects a branch that does not belong to the company', async () => {
    await expect(createDepartment({ companyId: 'company-other', branchId: 'branch-test-01', name: 'Finanzas', code: 'FIN' })).rejects.toMatchObject({ statusCode: 400 });
  });
});
