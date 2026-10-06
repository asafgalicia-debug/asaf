import { ApiError, requestData } from './api';
export type FinanceAccount={id:string;name:string;bankName:string;iban:string;status:'ACTIVE'|'INACTIVE'};
export type CashEntry={id:string;accountId:string;concept:string;type:'INFLOW'|'OUTFLOW';amount:number;date:string};
const hex=/^[a-f0-9]{24}$/i;
function record(v:unknown):v is Record<string,unknown>{return !!v&&typeof v==='object'&&!Array.isArray(v);}
function text(v:unknown):v is string{return typeof v==='string'&&!!v.trim();}
export async function financePage(base:string,token:string,kind:'bank-accounts'|'cash-movements',signal:AbortSignal,search='',cursor='',type='',status:'ACTIVE'|'INACTIVE'|''='') {
 const query=new URLSearchParams({search:search.trim(),limit:'20'});if(cursor)query.set('cursor',cursor);if(type)query.set('type',type);if(status&&kind==='bank-accounts')query.set('status',status);
 const data=await requestData(base,'/'+kind+'/page?'+query,{headers:{Authorization:'Bearer '+token},signal});
 if(!record(data)||!Array.isArray(data.items)||data.items.length>20||!(data.nextCursor===null||typeof data.nextCursor==='string'&&hex.test(data.nextCursor)))throw new ApiError('La API devolvió una página financiera inesperada.');
 const items=data.items.map((value):FinanceAccount|CashEntry=>{
  if(!record(value)||!text(value.id)||!hex.test(value.id))throw new ApiError('La API devolvió un registro financiero inesperado.');
  if(kind==='bank-accounts'){
   if(!text(value.name)||!text(value.bankName)||!text(value.iban)||!['ACTIVE','INACTIVE'].includes(String(value.status))||status&&value.status!==status)throw new ApiError('La API devolvió una cuenta inesperada.');
   return {id:value.id,name:value.name,bankName:value.bankName,iban:value.iban,status:value.status as FinanceAccount['status']};
  }
  if(!text(value.accountId)||!hex.test(value.accountId)||!text(value.concept)||!['INFLOW','OUTFLOW'].includes(String(value.type))||type&&value.type!==type||typeof value.amount!=='number'||!Number.isFinite(value.amount)||value.amount<=0||!text(value.date)||!/^\d{4}-\d{2}-\d{2}$/.test(value.date)||!Number.isFinite(Date.parse(value.date+'T00:00:00Z'))||new Date(value.date+'T00:00:00Z').toISOString().slice(0,10)!==value.date)throw new ApiError('La API devolvió un movimiento inesperado.');
  return {id:value.id,accountId:value.accountId,concept:value.concept,type:value.type as CashEntry['type'],amount:value.amount,date:value.date};
 });
 const ids=items.map(row=>row.id.toLowerCase());
 if(ids.some((id,i)=>i>0&&id>=ids[i-1]||cursor&&id>=cursor.toLowerCase())||data.nextCursor!==null&&(items.length!==20||data.nextCursor.toLowerCase()!==ids.at(-1)))throw new ApiError('La API devolvió una página financiera inconsistente.');
 return {items,nextCursor:data.nextCursor as string|null};
}
