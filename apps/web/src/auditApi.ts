import {ApiError,requestData} from './webApi';
export const auditActions=['LOGIN','LOGOUT','CREATE','UPDATE','DELETE','APPROVE'] as const;
export type AuditRow={id:string;companyId:string;branchId:string;action:string;module:string;createdAt:string;entityId?:string};
export type AuditPage={items:AuditRow[];nextCursor:string|null};
export async function auditPage(base:string,token:string,companyId:string,branchId:string,query:{module:string;action:string;cursor?:string},signal:AbortSignal):Promise<AuditPage>{
 const params=new URLSearchParams({limit:'20'});if(query.module.trim())params.set('module',query.module.trim());if(query.action)params.set('action',query.action);if(query.cursor)params.set('cursor',query.cursor);
 const raw=await requestData(base,'/audit/page?'+params,{headers:{Authorization:'Bearer '+token},signal});
 const invalid=()=>new ApiError('La API devolvió una página de auditoría inesperada.');
 if(!raw||typeof raw!=='object')throw invalid();const page=raw as AuditPage;
 if(!Array.isArray(page.items)||page.items.length>20||!(page.nextCursor===null||typeof page.nextCursor==='string'))throw invalid();
 let previous=query.cursor?.toLowerCase();
 for(const row of page.items){if(!row||typeof row.id!=='string'||!/^([a-f0-9]{24})$/i.test(row.id)||row.companyId!==companyId||row.branchId!==branchId||!auditActions.includes(row.action as typeof auditActions[number])||typeof row.module!=='string'||!row.module.trim()||typeof row.createdAt!=='string'||!Number.isFinite(Date.parse(row.createdAt))||(row.entityId!==undefined&&typeof row.entityId!=='string')||(query.module.trim()&&row.module!==query.module.trim())||(query.action&&row.action!==query.action))throw invalid();const id=row.id.toLowerCase();if(previous&&id>=previous)throw invalid();previous=id;}
 if(page.nextCursor!==null&&(page.items.length!==20||page.nextCursor!==page.items[19]?.id))throw invalid();return page;
}
