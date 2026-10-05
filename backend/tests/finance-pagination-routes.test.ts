import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import express from 'express';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
const state = vi.hoisted(() => ({ update: vi.fn(), audit: vi.fn(), create:vi.fn() }));
vi.mock('../src/middleware/authenticate.js', () => ({ authenticate: (req: any, res: any, next: any) => req.headers.authorization ? next() : res.sendStatus(401) }));
vi.mock('../src/middleware/tenant.js', () => ({ tenant: (req: any, _: any, next: any) => { req.tenant = { companyId: 'co', branchId: 'br', userId: 'user' }; next(); } }));
vi.mock('../src/middleware/authorize.js', () => ({ authorize: (permission: string) => (req: any, res: any, next: any) => ['usuarios.ver','usuarios.editar'].includes(permission) && req.headers.authorization === 'Bearer editor' ? next() : res.sendStatus(403) }));
vi.mock('../src/audit/auditLogger.js', () => ({ logAuditEvent: state.audit }));
vi.mock('../src/modules/finanzas/bankAccountService.js',()=>({pageBankAccounts:state.update,createBankAccount:vi.fn(),listBankAccounts:vi.fn()}));
vi.mock('../src/modules/finanzas/cashMovementService.js',()=>({pageCashMovements:state.update,createAuditedCashMovement:state.create,listCashMovements:vi.fn()}));
import {createBankAccountRoutes} from '../src/modules/finanzas/bankAccountRoutes.js';
import {createCashMovementRoutes} from '../src/modules/finanzas/cashMovementRoutes.js';
let server: Server; let base: string; const id = 'a'.repeat(24);
beforeAll(async () => {
 const app=express();app.use(express.json());app.use('/bank-accounts',createBankAccountRoutes());app.use('/cash-movements',createCashMovementRoutes());
 app.use((error: any, _: any, res: any, __: any) => res.status(error.statusCode ?? 500).json({ error: error.code }));
 server = app.listen(0); await new Promise<void>(resolve => server.once('listening', resolve)); base = 'http://127.0.0.1:' + (server.address() as AddressInfo).port;
});
afterAll(async () => { await new Promise<void>(resolve => server.close(() => resolve())); });
beforeEach(() => { state.update.mockReset(); state.audit.mockReset(); });
describe.each(['bank-accounts','cash-movements'])('%s pages', kind => {
 const send = (query = '', auth = 'Bearer editor') => fetch(base + '/' + kind + '/page' + query, { headers: auth ? { Authorization: auth } : {} });
 it('requires authentication and read permission', async () => { expect((await send('', '')).status).toBe(401); expect((await send('', 'Bearer denied')).status).toBe(403); expect(state.update).not.toHaveBeenCalled(); });
 it('rejects unsafe pagination and tenant overrides', async () => { for (const query of ['?limit=51','?cursor=bad','?companyId=foreign','?branchId=foreign','?search=a&search=b']) expect((await send(query)).status).toBe(400); expect(state.update).not.toHaveBeenCalled(); });
 it('uses authenticated scope and returns the page without writing audit', async () => { const page = { items: [], nextCursor: null }; state.update.mockResolvedValue(page); const response = await send('?search=Test&limit=20'); expect(response.status).toBe(200); expect((await response.json()).data).toEqual(page); expect(state.update).toHaveBeenCalledWith(...(['products','categories'].includes(kind) ? ['co',{search:'Test',limit:20}] : ['co','br',{search:'Test',limit:20}])); expect(state.audit).not.toHaveBeenCalled(); });
});

it('cash writes reject nonexistent dates, fractional cents, overflow and tenant overrides before persistence',async()=>{
 state.create.mockReset();const valid={accountId:'a'.repeat(24),concept:'Cash test',type:'INFLOW',amount:1,date:'2026-10-04'};
 for(const value of [{...valid,date:'2026-02-30'},{...valid,amount:0.001},{...valid,amount:1.001},{...valid,amount:1e20},{...valid,accountId:'bad'},{...valid,companyId:'foreign'}]){
  const response=await fetch(base+'/cash-movements',{method:'POST',headers:{Authorization:'Bearer editor','Content-Type':'application/json'},body:JSON.stringify(value)});expect(response.status).toBe(400);
 }
 expect(state.create).not.toHaveBeenCalled();
});

it('cash writes pass the authenticated audit user into atomic persistence', async()=>{
 state.create.mockReset();state.create.mockResolvedValue({id});
 const response=await fetch(base+'/cash-movements',{method:'POST',headers:{Authorization:'Bearer editor','Content-Type':'application/json'},body:JSON.stringify({accountId:id,concept:'Cash test',type:'INFLOW',amount:1,date:'2026-10-04'})});
 expect(response.status).toBe(201);expect(state.create).toHaveBeenCalledWith(expect.objectContaining({companyId:'co',branchId:'br'}),expect.objectContaining({userId:'user'}));expect(state.audit).not.toHaveBeenCalled();
});
