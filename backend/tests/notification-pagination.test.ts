import {expect,it,vi} from 'vitest';
const state=vi.hoisted(()=>({filter:undefined as unknown,limit:0,sort:undefined as unknown,rows:[] as any[]}));
vi.mock('../src/modules/notificaciones/models/Notification.js',()=>({getNotificationModel:()=>({find:(filter:unknown)=>{state.filter=filter;const q:any={sort:(sort:unknown)=>{state.sort=sort;return q;},limit:(n:number)=>{state.limit=n;return q;},lean:()=>q,exec:async()=>state.rows};return q;}})}));
import {pageNotifications} from '../src/modules/notificaciones/notificationService.js';
import {parseNotificationQuery} from '../src/modules/notificaciones/notificationPagination.js';
it('inbox query rejects tenant overrides, unsupported states, arrays and excessive pages',()=>{
 expect(parseNotificationQuery({})).toEqual({limit:20});
 for(const query of [{companyId:'foreign'},{userId:'foreign'},{limit:51},{cursor:'bad'},{status:'PENDING'},{status:['READ']}])expect(()=>parseNotificationQuery(query)).toThrow();
});
it('inbox pages bind owner, branch and in-app channel and use a bounded descending cursor',async()=>{
 state.rows=['c','b','a'].map(x=>({_id:x.repeat(24),status:'SENT'}));
 const page=await pageNotifications('co','br','owner',{limit:2,status:'SENT',cursor:'d'.repeat(24)});
 expect(state.filter).toEqual({companyId:'co',branchId:'br',userId:'owner',channel:'IN_APP',status:'SENT',_id:{$lt:'d'.repeat(24)}});
 expect(state.sort).toEqual({_id:-1});expect(state.limit).toBe(3);expect(page.items).toHaveLength(2);expect(page.nextCursor).toBe('b'.repeat(24));expect(page.items[0].isRead).toBe(false);
 state.rows=[];expect((await pageNotifications('co','br','owner',{limit:20})).nextCursor).toBe(null);
 expect((state.filter as any).status).toEqual({$in:['SENT','READ']});
});
