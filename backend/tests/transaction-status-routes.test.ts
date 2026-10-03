import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
const state = vi.hoisted(() => ({ update: vi.fn(), audit: vi.fn() }));
vi.mock('../src/middleware/authenticate.js', () => ({ authenticate: (req: any, res: any, next: any) => req.headers.authorization ? next() : res.sendStatus(401) }));
vi.mock('../src/middleware/tenant.js', () => ({ tenant: (req: any, _: any, next: any) => { req.tenant = { companyId: 'co', branchId: 'br', userId: 'user' }; next(); } }));
vi.mock('../src/middleware/authorize.js', () => ({ authorize: (permission: string) => (req: any, res: any, next: any) => permission === 'usuarios.editar' && req.headers.authorization === 'Bearer editor' ? next() : res.sendStatus(403) }));
vi.mock('../src/audit/auditLogger.js', () => ({ logAuditEvent: state.audit }));
vi.mock('../src/modules/ventas/saleService.js', () => ({ updateSaleStatus: state.update, createSale: vi.fn(), listSales: vi.fn() }));
vi.mock('../src/modules/compras/purchaseOrderService.js', () => ({ updatePurchaseOrderStatus: state.update, createPurchaseOrder: vi.fn(), listPurchaseOrders: vi.fn() }));
import { createSaleRoutes } from '../src/modules/ventas/saleRoutes.js';
import { createPurchaseOrderRoutes } from '../src/modules/compras/purchaseOrderRoutes.js';
let server: Server; let base: string; const id = 'a'.repeat(24);
beforeAll(async () => {
 const app = express(); app.use(express.json()); app.use('/sales', createSaleRoutes()); app.use('/purchase-orders', createPurchaseOrderRoutes());
 app.use((error: any, _: any, res: any, __: any) => res.status(error.statusCode ?? 500).json({ error: error.code }));
 server = app.listen(0); await new Promise<void>(resolve => server.once('listening', resolve)); base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
});
afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
beforeEach(() => { state.update.mockReset(); state.audit.mockReset(); });
describe.each(['sales', 'purchase-orders'])('%s PATCH', kind => {
 const body = { expectedStatus: 'PENDIENTE', status: kind === 'sales' ? 'PAGADA' : 'APROBADA' };
 const send = (payload: unknown, auth = 'Bearer editor', key = id) => fetch(base + '/' + kind + '/' + key + '/status', { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) }, body: JSON.stringify(payload) });
 it('requires authentication and editing permission before accessing records', async () => {
  expect((await send(body, '')).status).toBe(401); expect((await send(body, 'Bearer reader')).status).toBe(403); expect(state.update).not.toHaveBeenCalled();
 });
 it('rejects tenant overrides, incomplete fields and invalid identifiers', async () => {
  for (const payload of [{ ...body, companyId: 'foreign' }, { status: body.status }, { ...body, status: 'INVALID' }, { ...body, total: 123 }]) expect((await send(payload)).status).toBe(400);
  expect((await send(body, 'Bearer editor', 'bad')).status).toBe(400); expect(state.update).not.toHaveBeenCalled();
 });
 it('uses session scope and records audit without personal data', async () => {
  state.update.mockResolvedValue({ id, status: body.status });
  const response = await send(body); expect(response.status).toBe(200);
  expect(state.update).toHaveBeenCalledWith(id, 'co', 'br', body.expectedStatus, body.status);
  expect(state.audit).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE', entityId: id, details: { previousStatus: 'PENDIENTE', status: body.status }, companyId: 'co', branchId: 'br' }));
 });
});
