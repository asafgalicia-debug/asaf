import {ApiError,requestData} from './webApi';
export type Notice={id:string;companyId:string;branchId:string;userId:string;title:string;message:string;channel:'IN_APP';status:'SENT'|'READ';isRead:boolean;createdAt:string};
export type NoticePage={items:Notice[];nextCursor:string|null};
function validNotice(raw:unknown,companyId:string,branchId:string,userId?:string):raw is Notice{
 if(!raw||typeof raw!=='object')return false;const n=raw as Notice;
 return typeof n.id==='string'&&/^[a-f0-9]{24}$/i.test(n.id)&&n.companyId===companyId&&n.branchId===branchId&&typeof n.userId==='string'&&!!n.userId.trim()&&(!userId||n.userId===userId)&&n.channel==='IN_APP'&&['SENT','READ'].includes(n.status)&&n.isRead===(n.status==='READ')&&typeof n.title==='string'&&!!n.title.trim()&&n.title.length<=120&&typeof n.message==='string'&&!!n.message.trim()&&n.message.length<=4000&&typeof n.createdAt==='string'&&Number.isFinite(Date.parse(n.createdAt));
}
export async function noticePage(base:string,token:string,companyId:string,branchId:string,status:string,cursor?:string,signal?:AbortSignal,userId?:string):Promise<NoticePage>{
 if(status&&!['SENT','READ'].includes(status)||cursor&&!/^[a-f0-9]{24}$/i.test(cursor))throw new ApiError('Revisa el filtro de avisos.',400);
 const params=new URLSearchParams({limit:'20'});if(status)params.set('status',status);if(cursor)params.set('cursor',cursor);
 const raw=await requestData(base,'/notifications/page?'+params,{headers:{Authorization:'Bearer '+token},signal});
 const invalid=()=>new ApiError('No se pudo confirmar la bandeja de avisos.');
 if(!raw||typeof raw!=='object')throw invalid();const page=raw as NoticePage;
 if(!Array.isArray(page.items)||page.items.length>20||!(page.nextCursor===null||typeof page.nextCursor==='string'))throw invalid();
 let previous=cursor?.toLowerCase(),owner=userId;
 for(const n of page.items){if(!validNotice(n,companyId,branchId,owner)||(status&&n.status!==status)||(previous&&n.id.toLowerCase()>=previous))throw invalid();previous=n.id.toLowerCase();owner=n.userId;}
 if(page.nextCursor!==null&&(page.items.length!==20||page.nextCursor!==page.items[19].id))throw invalid();return page;
}
export async function readNotice(base:string,token:string,original:Notice,signal?:AbortSignal):Promise<Notice>{
 if(!/^[a-f0-9]{24}$/i.test(original.id))throw new ApiError('Selecciona un aviso válido.',400);
 const raw=await requestData(base,'/notifications/'+encodeURIComponent(original.id)+'/read',{method:'PATCH',headers:{Authorization:'Bearer '+token},signal});
 if(!validNotice(raw,original.companyId,original.branchId,original.userId)||raw.status!=='READ'||(['id','title','message','createdAt'] as const).some(key=>raw[key]!==original[key]))throw new ApiError('No se pudo confirmar la lectura. Actualiza la bandeja.');return raw;
}
