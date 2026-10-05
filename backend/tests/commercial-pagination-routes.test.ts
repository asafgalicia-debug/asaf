vi.mock('../src/core/commercialCreation.js',()=>({createAuditedSale:state.create,createAuditedPurchaseOrder:state.create,updateAuditedSaleStatus:state.update,updateAuditedPurchaseOrderStatus:state.update}));
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
const state = vi.hoisted(() => ({ update: vi.fn(), audit: vi.fn(), create:vi.fn() }));
vi.mock('../src/middleware/authenticate.js', () => ({ authenticate: (req: any, res: any, next: any) => req.headers.authorization ? next() : res.sendStatus(401) }));
vi.mock('../src/middleware/tenant.js', () => ({ tenant: (req: any, _: any, next: any) => { req.tenant = { companyId: 'co', branchId: 'br', userId: 'user' }; next(); } }));
vi.mock('../src/middleware/authorize.js', () => ({ authorize: (permission: string) => (req: any, res: any, next: any) => ['usuarios.ver','usuarios.editar'].includes(permission) && req.headers.authorization === 'Bearer editor' ? next() : res.sendStatus(403) }));
vi.mock('../src/audit/auditLogger.js', () => ({ logAuditEvent: state.audit }));
vi.mock('../src/modules/ventas/saleService.js', () => ({ pageSales: state.update, createSale: vi.fn(), listSales: vi.fn(), updateSaleStatus: vi.fn() }));
vi.mock('../src/modules/compras/purchaseOrderService.js', () => ({ pagePurchaseOrders: state.update, createPurchaseOrder: vi.fn(), listPurchaseOrders: vi.fn(), updatePurchaseOrderStatus: vi.fn() }));
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
describe.each(['sales','purchase-orders'])('%s pages', kind => {
 const send = (query = '', auth = 'Bearer editor') => fetch(base + '/' + kind + '/page' + query, { headers: auth ? { Authorization: auth } : {} });
 it('requires authentication and read permission', async () => { expect((await send('', '')).status).toBe(401); expect((await send('', 'Bearer denied')).status).toBe(403); expect(state.update).not.toHaveBeenCalled(); });
 it('rejects unsafe pagination and tenant overrides', async () => { for (const query of ['?limit=51','?cursor=bad','?companyId=foreign','?branchId=foreign','?status=INVALID','?status=PENDIENTE&status=PAGADA']) expect((await send(query)).status).toBe(400); expect(state.update).not.toHaveBeenCalled(); });
 it('uses authenticated scope and returns the page without writing audit', async () => { const page = { items: [], nextCursor: null }; state.update.mockResolvedValue(page); const response = await send('?status=PENDIENTE&limit=20'); expect(response.status).toBe(200); expect((await response.json()).data).toEqual(page); expect(state.update).toHaveBeenCalledWith('co','br',{status:'PENDIENTE',limit:20}); expect(state.audit).not.toHaveBeenCalled(); });
});

it.each(['sales','purchase-orders'])('%s creates through atomic service using the authenticated scope',async(kind)=>{
 state.create.mockReset();state.create.mockResolvedValue({id,total:2});state.audit.mockReset();
 const input=kind==='sales'?{customerId:id,productId:id,quantity:1}:{supplierId:id,productId:id,quantity:1,unitCost:2};
 const response=await fetch(base+'/'+kind,{method:'POST',headers:{Authorization:'Bearer editor','Content-Type':'application/json'},body:JSON.stringify(input)});
 expect(response.status).toBe(201);expect(state.create).toHaveBeenCalledWith({...input,companyId:'co',branchId:'br'},expect.objectContaining({userId:'user'}));expect(state.audit).not.toHaveBeenCalled();
});
