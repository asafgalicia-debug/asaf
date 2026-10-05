vi.mock('../src/modules/configuracion/configService.js',()=>({getModuleConfigModel:()=>({findOne:()=>({lean:()=>({exec:async()=>null})})})}));
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ warehouse: vi.fn(), product: vi.fn(), create: vi.fn(), aggregate: vi.fn(), init: vi.fn(), lock: vi.fn(), end: vi.fn() }));
vi.mock('mongoose', () => ({ default: { startSession: async () => ({ withTransaction: async (callback: () => Promise<unknown>) => callback(), endSession: mocks.end }) } }));
vi.mock('../src/modules/inventario/models/StockLock.js', () => ({ getStockLockModel: () => ({ init: mocks.init, updateOne: mocks.lock }) }));
vi.mock('../src/modules/inventario/models/Warehouse.js', () => ({ getWarehouseModel: () => ({ exists: mocks.warehouse }) }));
vi.mock('../src/modules/productos/models/Product.js', () => ({ getProductModel: () => ({ exists: mocks.product }) }));
vi.mock('../src/modules/inventario/models/StockMovement.js', () => ({ getStockMovementModel: () => ({ init: mocks.init, create: mocks.create, aggregate: mocks.aggregate }) }));
import { listStock, receiveStock, issueStock, transferStock } from '../src/modules/inventario/stockService.js';
const input = { companyId: 'co-a', branchId: 'br-a', warehouseId: 'wh-a', productId: 'pr-a', quantity: 5, reference: 'receipt-1', userId: 'user-a' };
beforeEach(() => {
  vi.resetAllMocks(); mocks.warehouse.mockResolvedValue(true); mocks.product.mockResolvedValue(true);
  mocks.create.mockImplementation(async ([data]) => [{ ...data, _id: 'movement-a' }]);
  mocks.aggregate.mockReturnValue({ session: () => ({ exec: async () => [{ quantity: 10 }] }) });
});
it('records an issue as a negative movement inside a transaction', async () => {
  expect(await issueStock(input)).toMatchObject({ quantity: -5, kind: 'ISSUE' });
  expect(mocks.lock).toHaveBeenLastCalledWith({ _id: JSON.stringify(['co-a', 'br-a', 'wh-a', 'pr-a']) }, { $inc: { version: 1 } }, { session: expect.any(Object) });
  expect(mocks.create).toHaveBeenCalledWith([expect.objectContaining({ quantity: -5, userId: 'user-a' })], { session: expect.any(Object) });
  expect(mocks.end).toHaveBeenCalledOnce();
});
it('rejects a withdrawal larger than the available balance', async () => {
  await expect(issueStock({ ...input, quantity: 11 })).rejects.toMatchObject({ statusCode: 409 });
  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.end).toHaveBeenCalledOnce();
});
it('rejects withdrawals from a balance without movements', async () => {
  mocks.aggregate.mockReturnValue({ session: () => ({ exec: async () => [] }) });
  await expect(issueStock(input)).rejects.toMatchObject({ statusCode: 409 });
  expect(mocks.create).not.toHaveBeenCalled();
});
it('ends the session when saving fails', async () => {
  mocks.create.mockRejectedValue(new Error('database unavailable'));
  await expect(issueStock(input)).rejects.toThrow('database unavailable');
  expect(mocks.end).toHaveBeenCalledOnce();
});
it('validates warehouse branch and product company before recording a receipt', async () => {
  expect(await receiveStock(input)).toMatchObject({ quantity: 5, reference: 'receipt-1' });
  expect(mocks.warehouse).toHaveBeenCalledWith({ _id: 'wh-a', companyId: 'co-a', branchId: 'br-a', status: 'ACTIVE' });
  expect(mocks.product).toHaveBeenCalledWith({ _id: 'pr-a', companyId: 'co-a', status: 'ACTIVE' });
});
it('rejects invalid references without recording a movement', async () => {
  mocks.warehouse.mockResolvedValue(null);
  await expect(receiveStock(input)).rejects.toMatchObject({ statusCode: 400 });
  expect(mocks.create).not.toHaveBeenCalled();
});
it('rejects negative quantities', async () => {
  await expect(receiveStock({ ...input, quantity: -1 })).rejects.toMatchObject({ statusCode: 400 });
  expect(mocks.create).not.toHaveBeenCalled();
});
it('reports duplicate references as conflicts', async () => {
  mocks.create.mockRejectedValue({ code: 11000 });
  await expect(receiveStock(input)).rejects.toMatchObject({ statusCode: 409 });
});
it('scopes stock aggregation to the authenticated company and branch', async () => {
  mocks.aggregate.mockReturnValue({ exec: async () => [] });
  expect(await listStock('co-a', 'br-a')).toEqual([]);
  expect(mocks.aggregate.mock.calls[0][0][0]).toEqual({ $match: { companyId: 'co-a', branchId: 'br-a' } });
});
it('records both transfer balance effects as one transaction document', async () => {
  expect(await transferStock({ ...input, destinationWarehouseId: 'wh-b' })).toMatchObject({ quantity: -5, kind: 'TRANSFER', destinationWarehouseId: 'wh-b' });
  expect(mocks.create).toHaveBeenCalledOnce();
  expect(mocks.create).toHaveBeenCalledWith([expect.objectContaining({ warehouseId: 'wh-a', destinationWarehouseId: 'wh-b', reference: 'receipt-1' })], { session: expect.any(Object) });
  expect(mocks.lock.mock.calls.filter((call) => call[1].$inc).map((call) => call[0]._id)).toEqual([
    JSON.stringify(['co-a', 'br-a', 'wh-a', 'pr-a']), JSON.stringify(['co-a', 'br-a', 'wh-b', 'pr-a'])
  ]);
  expect(mocks.warehouse).toHaveBeenCalledWith({ _id: 'wh-b', companyId: 'co-a', branchId: 'br-a', status: 'ACTIVE' });
});
it('rejects transfers to the source warehouse without writing', async () => {
  await expect(transferStock({ ...input, destinationWarehouseId: 'wh-a' })).rejects.toMatchObject({ statusCode: 400 });
  expect(mocks.create).not.toHaveBeenCalled();
});
it('rejects a destination outside the active tenant scope', async () => {
  mocks.warehouse.mockResolvedValueOnce(true).mockResolvedValueOnce(null);
  await expect(transferStock({ ...input, destinationWarehouseId: 'other-branch' })).rejects.toMatchObject({ statusCode: 400 });
  expect(mocks.lock).not.toHaveBeenCalled();
});
it('rejects insufficient transfer stock without creating either balance effect', async () => {
  await expect(transferStock({ ...input, quantity: 11, destinationWarehouseId: 'wh-b' })).rejects.toMatchObject({ statusCode: 409 });
  expect(mocks.create).not.toHaveBeenCalled();
  expect(mocks.end).toHaveBeenCalledOnce();
});
it('uses the same lock order when transferring in reverse', async () => {
  await transferStock({ ...input, warehouseId: 'wh-b', destinationWarehouseId: 'wh-a' });
  expect(mocks.lock.mock.calls.filter((call) => call[1].$inc).map((call) => call[0]._id)).toEqual([
    JSON.stringify(['co-a', 'br-a', 'wh-a', 'pr-a']), JSON.stringify(['co-a', 'br-a', 'wh-b', 'pr-a'])
  ]);
});
it('expands transfer destination credits before grouping stock balances', async () => {
  mocks.aggregate.mockReturnValue({ exec: async () => [] });
  await listStock('co-a', 'br-a');
  const pipeline = mocks.aggregate.mock.calls[0][0];
  expect(pipeline[1].$project.effects.$concatArrays[1].$cond).toEqual([
    { $eq: ['$kind', 'TRANSFER'] }, [{ warehouseId: '$destinationWarehouseId', quantity: { $multiply: ['$quantity', -1] } }], []
  ]);
  expect(pipeline[3].$group.quantity).toEqual({ $sum: '$effects.quantity' });
});
