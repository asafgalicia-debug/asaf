import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ find: vi.fn(), select: vi.fn(), sort: vi.fn(), limit: vi.fn(), lean: vi.fn(), exec: vi.fn() }));
vi.mock('../src/modules/inventario/models/StockMovement.js', () => ({ getStockMovementModel: () => ({ find: mocks.find }) }));
import { listStockHistory } from '../src/modules/inventario/stockHistoryService.js';
beforeEach(() => {
  vi.resetAllMocks();
  mocks.find.mockReturnValue({ select: mocks.select });
  mocks.select.mockReturnValue({ sort: mocks.sort });
  mocks.sort.mockReturnValue({ limit: mocks.limit });
  mocks.limit.mockReturnValue({ lean: mocks.lean });
  mocks.lean.mockReturnValue({ exec: mocks.exec });
  mocks.exec.mockResolvedValue([]);
});
it('scopes history and caps the default page', async () => {
  expect(await listStockHistory('company-a', 'branch-a')).toEqual({ items: [], nextCursor: null });
  expect(mocks.find).toHaveBeenCalledWith({ companyId: 'company-a', branchId: 'branch-a' });
  expect(mocks.sort).toHaveBeenCalledWith({ _id: -1 });
  expect(mocks.limit).toHaveBeenCalledWith(26);
});
it('returns an older-page cursor without exposing the extra row', async () => {
  mocks.exec.mockResolvedValue([
    { _id: 'b'.repeat(24), kind: 'TRANSFER', quantity: -2, destinationWarehouseId: 'destination' },
    { _id: 'a'.repeat(24), quantity: 1 }
  ]);
  const page = await listStockHistory('co', 'br', { limit: 1 });
  expect(page.items).toHaveLength(1);
  expect(page.nextCursor).toBe('b'.repeat(24));
  expect(page.items[0]).toMatchObject({ kind: 'TRANSFER', quantity: -2, destinationWarehouseId: 'destination' });
});
it('uses exact reference matching and a tenant-scoped cursor', async () => {
  await listStockHistory('co', 'br', { cursor: 'a'.repeat(24), reference: ' ref.* ' });
  expect(mocks.find).toHaveBeenCalledWith({ companyId: 'co', branchId: 'br', _id: { $lt: 'a'.repeat(24) }, reference: 'ref.*' });
});
it.each([{ limit: 0 }, { limit: 101 }, { limit: 1.5 }, { cursor: 'bad' }, { reference: ' ' }, { reference: 'a'.repeat(101) }])('rejects invalid filters %j before querying', async (query) => {
  await expect(listStockHistory('co', 'br', query)).rejects.toMatchObject({ statusCode: 400 });
  expect(mocks.find).not.toHaveBeenCalled();
});
it('labels legacy receipts and returns no cursor on the last page', async () => {
  mocks.exec.mockResolvedValue([{ _id: 'a'.repeat(24), quantity: 5 }]);
  expect(await listStockHistory('co', 'br')).toMatchObject({ items: [{ kind: 'RECEIPT', quantity: 5 }], nextCursor: null });
});
it('does not disguise database failures as empty history', async () => {
  mocks.exec.mockRejectedValue(new Error('database unavailable'));
  await expect(listStockHistory('co', 'br')).rejects.toThrow('database unavailable');
});
