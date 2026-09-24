import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/clientes/models/Customer.js', () => ({ getCustomerModel: () => ({ exists: async (filter: any) => filter.companyId === 'co-1' && filter._id === 'cust-1' }) }));
vi.mock('../src/modules/proyectos/models/Project.js', () => ({ getProjectModel: () => ({ find: (filter: any) => { const q: any = { sort: () => q, lean: () => q, exec: async () => state.rows.filter((r) => r.companyId === filter.companyId && r.branchId === filter.branchId) }; return q; }, create: async (i: any) => { const r = { ...i, _id: `project-${state.rows.length + 1}` }; state.rows.push(r); return r; } }) }));
import { createProject, listProjects } from '../src/modules/proyectos/projectService.js';
describe('project domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('filters projects by company and branch', async () => { await createProject({ companyId: 'co-1', branchId: 'br-1', customerId: 'cust-1', name: 'ERP Setup', startDate: '2026-09-01', endDate: '2026-12-31' }); state.rows.push({ _id: 'other', companyId: 'co-1', branchId: 'br-2', customerId: 'cust-1', name: 'Other', status: 'ACTIVE', progress: 0, startDate: '2026-09-01', endDate: '2026-12-31' }); expect(await listProjects('co-1', 'br-1')).toHaveLength(1); });
  it('creates active projects at zero progress', async () => { const row = await createProject({ companyId: 'co-1', branchId: 'br-1', customerId: 'cust-1', name: 'ERP Setup', startDate: '2026-09-01', endDate: '2026-12-31' }); expect(row.status).toBe('ACTIVE'); expect(row.progress).toBe(0); });
});