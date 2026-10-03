import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
const state = vi.hoisted(() => ({ update: vi.fn(), audit: vi.fn() }));
vi.mock('../src/middleware/authenticate.js', () => ({ authenticate: (req: any, res: any, next: any) => req.headers.authorization ? next() : res.sendStatus(401) }));
vi.mock('../src/middleware/tenant.js', () => ({ tenant: (req: any, _: any, next: any) => { req.tenant = { companyId: 'co', branchId: 'br', userId: 'user' }; next(); } }));
vi.mock('../src/middleware/authorize.js', () => ({ authorize: (permission: string) => (req: any, res: any, next: any) => permission === 'usuarios.editar' && req.headers.authorization === 'Bearer editor' ? next() : res.sendStatus(403) }));
vi.mock('../src/audit/auditLogger.js', () => ({ logAuditEvent: state.audit }));
vi.mock('../src/modules/productos/categoryService.js', () => ({ renameCategory: state.update, createCategory: vi.fn(), listCategories: vi.fn() }));
vi.mock('../src/modules/inventario/warehouseService.js', () => ({ renameWarehouse: state.update, createWarehouse: vi.fn(), listWarehouses: vi.fn() }));
import { createCategoryRoutes } from '../src/modules/productos/categoryRoutes.js';
import { createWarehouseRoutes } from '../src/modules/inventario/warehouseRoutes.js';
let server: Server; let base: string; const id = 'a'.repeat(24);
beforeAll(async () => {
 const app = express(); app.use(express.json()); app.use('/categories', createCategoryRoutes()); app.use('/warehouses', createWarehouseRoutes());
 app.use((error: any, _: any, res: any, __: any) => res.status(error.statusCode ?? 500).json({ error: error.code }));
 server = app.listen(0); await new Promise<void>(resolve => server.once('listening', resolve)); base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
});
afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
beforeEach(() => { state.update.mockReset(); state.audit.mockReset(); });
describe.each(['categories', 'warehouses'])('%s PATCH', kind => {
 const body = { name: 'New name', expectedName: 'Old name' };
 const send = (payload: unknown, auth = 'Bearer editor', key = id) => fetch(base + '/' + kind + '/' + key, { method: 'PATCH', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) }, body: JSON.stringify(payload) });
 it('requires authentication and editing permission before accessing records', async () => {
  expect((await send(body, '')).status).toBe(401); expect((await send(body, 'Bearer reader')).status).toBe(403); expect(state.update).not.toHaveBeenCalled();
 });
 it('rejects tenant overrides, incomplete fields and invalid identifiers', async () => {
  for (const payload of [{ ...body, companyId: 'foreign' }, { name: 'New name' }, { ...body, name: 'A' }, { ...body, code: 'CHANGED' }, { ...body, status: 'INACTIVE' }, { ...body, branchId: 'foreign' }]) expect((await send(payload)).status).toBe(400);
  expect((await send(body, 'Bearer editor', 'bad')).status).toBe(400); expect(state.update).not.toHaveBeenCalled();
 });
 it('uses session scope and records audit without personal data', async () => {
  state.update.mockResolvedValue({ id, ...body, status: 'ACTIVE' });
  const response = await send(body); expect(response.status).toBe(200);
  expect(state.update).toHaveBeenCalledWith(...(kind === 'categories' ? [id, 'co', body.expectedName, body.name] : [id, 'co', 'br', body.expectedName, body.name]));
  expect(state.audit).toHaveBeenCalledWith(expect.objectContaining({ action: 'UPDATE', entityId: id, details: { fields: ['name'] }, companyId: 'co', branchId: 'br' }));
 });
});
