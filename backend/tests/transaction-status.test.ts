import { beforeEach, describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock('../src/modules/ventas/models/Sale.js', () => ({ getSaleModel: () => ({ findOneAndUpdate: (...args: unknown[]) => ({ exec: () => state.update(...args) }) }) }));
vi.mock('../src/modules/compras/models/PurchaseOrder.js', () => ({ getPurchaseOrderModel: () => ({ findOneAndUpdate: (...args: unknown[]) => ({ exec: () => state.update(...args) }) }) }));
import { allowedTransactionTransition } from '../src/core/transactionStatus.js';
import { updateSaleStatus } from '../src/modules/ventas/saleService.js';
import { updatePurchaseOrderStatus } from '../src/modules/compras/purchaseOrderService.js';
const statuses = ['PENDIENTE', 'PAGADA', 'APROBADA', 'RECIBIDA', 'CANCELADA'] as const;
it('allows only documented forward transitions', () => {
 for (const kind of ['sales', 'purchase-orders'] as const) for (const from of statuses) for (const to of statuses) {
  const expected = kind === 'sales' ? ['PENDIENTE:PAGADA', 'PENDIENTE:CANCELADA'] : ['PENDIENTE:APROBADA', 'PENDIENTE:CANCELADA', 'APROBADA:RECIBIDA', 'APROBADA:CANCELADA'];
  expect(allowedTransactionTransition(kind, from, to)).toBe(expected.includes(from + ':' + to));
 }
});
describe.each([['sale', updateSaleStatus, 'PAGADA'], ['purchase', updatePurchaseOrderStatus, 'APROBADA']] as const)('%s state update', (_, update, target) => {
 beforeEach(() => { state.update.mockReset(); });
 it('changes only state and scopes optimistic update by company and branch', async () => {
  state.update.mockResolvedValue({ _id: 'id', companyId: 'co', branchId: 'br', customerId: 'customer', supplierId: 'supplier', productId: 'product', quantity: 2, unitPrice: 10, unitCost: 10, total: 20, status: target });
  const row = await update('id', 'co', 'br', 'PENDIENTE', target as any);
  expect(state.update).toHaveBeenCalledWith({ _id: 'id', companyId: 'co', branchId: 'br', status: 'PENDIENTE' }, { $set: { status: target } }, { new: true, runValidators: true });
  expect(row.total).toBe(20); expect(row.quantity).toBe(2);
 });
 it('rejects stale state or foreign records', async () => {
  state.update.mockResolvedValue(null); await expect(update('id', 'co', 'br', 'PENDIENTE', target as any)).rejects.toMatchObject({ statusCode: 409 });
 });
 it('blocks terminal reversal before accessing persistence', async () => {
  await expect(update('id', 'co', 'br', 'CANCELADA', 'PENDIENTE')).rejects.toMatchObject({ statusCode: 400 }); expect(state.update).not.toHaveBeenCalled();
 });
 it('allows only one of two concurrent updates from the same state', async () => {
  let pending = true; state.update.mockImplementation(() => { if (!pending) return null; pending = false; return { _id: 'id', status: target }; });
  const results = await Promise.allSettled([update('id', 'co', 'br', 'PENDIENTE', target as any), update('id', 'co', 'br', 'PENDIENTE', target as any)]);
  expect(results.filter(row => row.status === 'fulfilled')).toHaveLength(1);
  expect(results.find(row => row.status === 'rejected')).toMatchObject({ reason: { statusCode: 409 } });
 });
});
