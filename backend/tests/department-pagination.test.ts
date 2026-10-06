import {expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({filter:undefined as unknown,limit:0,rows:[] as any[]}));
vi.mock('../src/modules/empresas/models/Department.js',()=>({getDepartmentModel:()=>({find:(f:unknown)=>{state.filter=f;const q:any={sort:()=>q,limit:(n:number)=>{state.limit=n;return q;},lean:()=>q,exec:async()=>state.rows};return q;}})}));
import {parseDepartmentQuery,pageDepartments} from '../src/modules/empresas/departmentService.js';
it('department query rejects caller scope, unsupported state and unbounded queries',()=>{
 expect(parseDepartmentQuery({})).toEqual({search:'',limit:20});
 for(const q of [{companyId:'other'},{branchId:'other'},{limit:51},{cursor:''},{status:'DELETED'},{search:['x']}])expect(()=>parseDepartmentQuery(q)).toThrow();
});
it('department pages use literal name/code search and stable scoped cursors',async()=>{
 state.rows=['z','y','x'].map(id=>({_id:id,name:'A+B',code:'OPS',status:'ACTIVE'}));const page=await pageDepartments('co','br',{search:'A+B',limit:2,status:'ACTIVE',cursor:'zz'});
 expect(state.filter).toEqual({companyId:'co',branchId:'br',status:'ACTIVE',_id:{$lt:'zz'},$or:[{name:{$regex:'A\\+B',$options:'i'}},{code:{$regex:'A\\+B',$options:'i'}}]});expect(state.limit).toBe(3);expect(page.items).toHaveLength(2);expect(page.nextCursor).toBe('y');
});
