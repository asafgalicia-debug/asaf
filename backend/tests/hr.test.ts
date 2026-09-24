import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/usuarios/models/User.js', () => ({ getUserModel: () => ({ exists: async (filter: any) => filter.companyId === 'co-1' && filter.branchId === 'br-1' && filter._id === 'user-1' }) }));
vi.mock('../src/modules/recursos-humanos/models/Employee.js', () => ({ getEmployeeModel: () => ({ find: (filter: any) => { const q: any = { sort: () => q, lean: () => q, exec: async () => state.rows.filter((r) => r.companyId === filter.companyId && r.branchId === filter.branchId) }; return q; }, create: async (i: any) => { const r = { ...i, _id: `employee-${state.rows.length + 1}` }; state.rows.push(r); return r; } }) }));
import { createEmployee, listEmployees } from '../src/modules/recursos-humanos/employeeService.js';
describe('hr domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('filters employees by company and branch', async () => { await createEmployee({ companyId: 'co-1', branchId: 'br-1', departmentId: 'dept-1', userId: 'user-1', fullName: 'Ana Garcia', position: 'Operations Manager' }); state.rows.push({ _id: 'other', companyId: 'co-1', branchId: 'br-2', departmentId: 'dept-1', userId: 'user-2', fullName: 'Other', position: 'Staff', status: 'ACTIVE' }); expect(await listEmployees('co-1', 'br-1')).toHaveLength(1); });
  it('creates an active employee linked to the user', async () => { const row = await createEmployee({ companyId: 'co-1', branchId: 'br-1', departmentId: 'dept-1', userId: 'user-1', fullName: 'Luis Perez', position: 'Operations Analyst' }); expect(row.fullName).toBe('Luis Perez'); expect(row.status).toBe('ACTIVE'); });
});