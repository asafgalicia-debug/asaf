import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/inteligencia-artificial/models/AIInsight.js', () => ({ getAIInsightModel: () => ({
  find: (filter: any) => { const query: any = { sort: () => query, lean: () => query, exec: async () => state.rows.filter((r) => r.companyId === filter.companyId && r.branchId === filter.branchId && r.userId === filter.userId) }; return query; },
  create: async (input: any) => { const row = { ...input, _id: `ai-${state.rows.length + 1}`, toObject() { return { ...this }; } }; state.rows.push(row); return row; }
}) }));
import { createAIInsight, listAIInsights } from '../src/modules/inteligencia-artificial/aiService.js';
describe('AI request domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('scopes pending requests to the tenant and user', async () => {
    await createAIInsight({ companyId: 'co-1', branchId: 'br-1', userId: 'user-1', kind: 'forecast', title: 'PronÃ³stico', data: { range: 30 } });
    state.rows.push({ _id: 'other', companyId: 'co-1', branchId: 'br-1', userId: 'user-2', kind: 'forecast', title: 'Privado' });
    expect(await listAIInsights('co-1', 'br-1', 'user-1')).toHaveLength(1);
  });
  it('creates a pending request without fabricating an AI result', async () => {
    const request = await createAIInsight({ companyId: 'co-1', branchId: 'br-1', userId: 'user-1', kind: 'forecast', title: 'PronÃ³stico', data: { range: 30 } });
    expect(request.status).toBe('PENDING');
    expect(request.approved).toBe(false);
    expect(request.result).toBeUndefined();
  });
  it('rejects credentials in analysis data', async () => {
    await expect(createAIInsight({ companyId: 'co-1', branchId: 'br-1', userId: 'user-1', kind: 'summary', title: 'AnÃ¡lisis', data: { apiKey: 'secret' } })).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
  });
});
