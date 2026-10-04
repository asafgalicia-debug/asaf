import { beforeEach, expect, it, vi } from 'vitest';
const state=vi.hoisted(()=>{const exec=vi.fn(),limit=vi.fn(()=>({lean:()=>({exec})})),sort=vi.fn(()=>({limit})),find=vi.fn(()=>({sort}));return{exec,limit,sort,find};});
vi.mock('../src/modules/finanzas/models/FinanceModels.js',()=>({getBankAccountModel:()=>({find:state.find}),getCashMovementModel:()=>({find:state.find})}));
import { pageBankAccounts } from '../src/modules/finanzas/bankAccountService.js';
import { pageCashMovements } from '../src/modules/finanzas/cashMovementService.js';
import { parseCashQuery } from '../src/modules/finanzas/cashPagination.js';
beforeEach(()=>vi.clearAllMocks());
it('accounts preserve scoped status, bounded IDs and page cursor',async()=>{
 state.exec.mockResolvedValue([{_id:'b'.repeat(24),name:'B'},{_id:'a'.repeat(24),name:'A'}]);
 const result=await pageBankAccounts('co','br',{search:'A+B',limit:1,status:'ACTIVE'});
 expect(result.nextCursor).toBe('b'.repeat(24));expect(state.find).toHaveBeenCalledWith(expect.objectContaining({companyId:'co',branchId:'br',status:'ACTIVE'}));expect(state.limit).toHaveBeenCalledWith(2);expect(state.sort).toHaveBeenCalledWith({_id:-1});
});
it('cash pages apply company, branch, account and type before limiting',async()=>{
 state.exec.mockResolvedValue([]);await pageCashMovements('co','br',{search:'2026',limit:20,cursor:'b'.repeat(24),accountId:'a'.repeat(24),type:'OUTFLOW'});
 expect(state.find).toHaveBeenCalledWith(expect.objectContaining({companyId:'co',branchId:'br',accountId:'a'.repeat(24),type:'OUTFLOW',_id:{$lt:'b'.repeat(24)}}));expect(state.limit).toHaveBeenCalledWith(21);
});
it('cash query rejects tenant overrides, wrong types and unbounded pagination',()=>{
 for(const value of [{companyId:'foreign'},{type:'UNKNOWN'},{accountId:'bad'},{limit:51},{cursor:'bad'},{search:['A','B']},{status:'ACTIVE'}])expect(()=>parseCashQuery(value)).toThrow();
 expect(parseCashQuery({type:'INFLOW'})).toEqual({type:'INFLOW',search:'',limit:20});
});
