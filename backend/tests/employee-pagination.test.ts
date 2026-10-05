import {expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({filter:undefined as unknown,limit:0,rows:[] as any[]}));
vi.mock('../src/modules/recursos-humanos/models/Employee.js',()=>({getEmployeeModel:()=>({find:(filter:unknown)=>{state.filter=filter;const q:any={sort:()=>q,limit:(n:number)=>{state.limit=n;return q;},lean:()=>q,exec:async()=>state.rows};return q;}})}));
import {pageEmployees} from '../src/modules/recursos-humanos/employeeService.js';
it('employee pages scope branch, escape search and return a bounded cursor',async()=>{
 state.rows=['c','b','a'].map(x=>({_id:x.repeat(24),fullName:'Ana'}));const page=await pageEmployees('co','br',{limit:2,search:'Ana.*',status:'ACTIVE',cursor:'d'.repeat(24)});
 expect(state.filter).toEqual({companyId:'co',branchId:'br',status:'ACTIVE',_id:{$lt:'d'.repeat(24)},$or:[{fullName:{$regex:'Ana\\.\\*',$options:'i'}},{position:{$regex:'Ana\\.\\*',$options:'i'}}]});expect(state.limit).toBe(3);expect(page.items).toHaveLength(2);expect(page.nextCursor).toBe('b'.repeat(24));
});
