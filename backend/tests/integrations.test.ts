import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/integraciones/models/Integration.js', () => ({ getIntegrationModel: () => ({
  find: (filter: any) => { const query: any = { sort: () => query, lean: () => query, exec: async () => state.rows.filter((r) => r.companyId === filter.companyId && r.branchId === filter.branchId) }; return query; },
  create: async (input: any) => { const row = { ...input, _id: `integration-${state.rows.length + 1}`, toObject() { return { ...this }; } }; state.rows.push(row); return row; }
}) }));
import { createIntegration, listIntegrations } from '../src/modules/integraciones/integrationService.js';
describe('integration domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('lists integrations only for the matching tenant', async () => {
    await createIntegration({ companyId: 'co-1', branchId: 'br-1', createdBy: 'user-1', name: 'CRM', provider: 'salesforce', type: 'crm', config: { region: 'us' } });
    state.rows.push({ _id: 'other', companyId: 'co-1', branchId: 'br-2', name: 'Other' });
    expect(await listIntegrations('co-1', 'br-1')).toHaveLength(1);
  });
  it('creates integrations paused and without storing secrets', async () => {
    const row = await createIntegration({ companyId: 'co-1', branchId: 'br-1', createdBy: 'user-1', name: 'CRM', provider: 'salesforce', type: 'crm', config: { region: 'us' } });
    expect(row.status).toBe('PAUSED');
    await expect(createIntegration({ companyId: 'co-1', branchId: 'br-1', createdBy: 'user-1', name: 'Unsafe', provider: 'custom', type: 'crm', config: { apiKey: 'secret' } })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});
