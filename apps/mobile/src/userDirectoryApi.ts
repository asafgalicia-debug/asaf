import {ApiError,requestData} from './api';
export type DirectoryUser={id:string;name:string;email:string;companyId:string;branchId:string;roleId:string;permissions:string[];isActive:boolean};
export async function userPage(base:string,token:string,co:string,br:string,search:string,status:string,cursor?:string,signal?:AbortSignal){
 const q=new URLSearchParams({search:search.trim(),limit:'20'});if(status)q.set('status',status);if(cursor)q.set('cursor',cursor);
 const raw=await requestData(base,'/users/page?'+q,{headers:{Authorization:'Bearer '+token},signal});const fail=()=>new ApiError('No se pudo confirmar la lista de usuarios.');
 if(!raw||typeof raw!=='object')throw fail();const p=raw as {items:DirectoryUser[];nextCursor:string|null};
 if(!Array.isArray(p.items)||p.items.length>20||!(p.nextCursor===null||typeof p.nextCursor==='string'))throw fail();let previous=cursor;
 for(const row of p.items){if(!row||! /^[a-f0-9]{24}$/i.test(row.id)||row.companyId!==co||row.branchId!==br||typeof row.name!=='string'||!row.name.trim()||typeof row.email!=='string'||!row.email.includes('@')||typeof row.roleId!=='string'||!row.roleId||typeof row.isActive!=='boolean'||!Array.isArray(row.permissions)||row.permissions.some(v=>typeof v!=='string')||(status&&row.isActive!==(status==='ACTIVE'))||(previous&&row.id>=previous)||Object.keys(row).some(k=>/password|verificationHash|verificationEmail|verificationExpires|verificationSent/i.test(k)))throw fail();previous=row.id;}
 if(p.nextCursor!==null&&(p.items.length!==20||p.nextCursor!==p.items[19].id))throw fail();return p;
}
