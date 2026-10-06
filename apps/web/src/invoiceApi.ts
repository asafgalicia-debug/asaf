import {ApiError,requestData} from './webApi';
export type Invoice={id:string;companyId:string;branchId:string;number:string;status:'BORRADOR'|'EMITIDA'|'PAGADA'|'CANCELADA';saleId:string;customerId:string;issueDate:string;dueDate:string;subtotal:number;taxRate:number;tax:number;total:number;updatedAt:string};
const date=(v:unknown)=>{if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v))return false;const d=new Date(v+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===v;};
export async function invoicePage(base:string,token:string,co:string,br:string,search:string,status:string,cursor?:string,signal?:AbortSignal){
 const q=new URLSearchParams({search:search.trim(),limit:'20'});if(status)q.set('status',status);if(cursor)q.set('cursor',cursor);
 const raw:any=await requestData(base,'/invoices/page?'+q,{headers:{Authorization:'Bearer '+token},signal});const fail=()=>new ApiError('No se pudo confirmar la página de Facturación.');
 if(!raw||!Array.isArray(raw.items)||raw.items.length>20||!(raw.nextCursor===null||typeof raw.nextCursor==='string'))throw fail();let previous=cursor;
 for(const r of raw.items){if(!r||!/^[a-f0-9]{24}$/i.test(r.id)||r.companyId!==co||r.branchId!==br||typeof r.number!=='string'||!r.number.trim()||!['BORRADOR','EMITIDA','PAGADA','CANCELADA'].includes(r.status)||(status&&r.status!==status)||!['subtotal','taxRate','tax','total'].every(k=>typeof r[k]==='number'&&Number.isFinite(r[k])&&r[k]>=0)||r.taxRate>100||!date(r.issueDate)||!date(r.dueDate)||r.dueDate<r.issueDate||Math.abs(r.tax-Math.round(r.subtotal*r.taxRate)/100)>0.000001||Math.abs(r.total-Math.round((r.subtotal+r.tax)*100)/100)>0.000001||typeof r.updatedAt!=='string'||!Number.isFinite(Date.parse(r.updatedAt))||(previous&&r.id>=previous))throw fail();previous=r.id;}
 if(raw.nextCursor!==null&&(raw.items.length!==20||raw.nextCursor!==raw.items[19].id))throw fail();return raw as {items:Invoice[];nextCursor:string|null};
}

export type InvoiceSale={id:string;companyId:string;branchId:string;customerId:string;customerName:string;total:number;status:'PENDIENTE'|'PAGADA';createdAt:string};
export async function invoiceSales(base:string,token:string,co:string,br:string,cursor?:string,signal?:AbortSignal){
 const q=new URLSearchParams({limit:'20'});if(cursor)q.set('cursor',cursor);const raw:any=await requestData(base,'/invoices/sale-options?'+q,{headers:{Authorization:'Bearer '+token},signal});
 if(!raw||!Array.isArray(raw.items)||raw.items.length>20||!(raw.nextCursor===null||typeof raw.nextCursor==='string'))throw new ApiError('No se pudo confirmar la lista de ventas.');let previous=cursor;
 for(const r of raw.items){if(!r||!/^[a-f0-9]{24}$/i.test(r.id)||r.companyId!==co||r.branchId!==br||!['PENDIENTE','PAGADA'].includes(r.status)||typeof r.customerName!=='string'||typeof r.total!=='number'||!Number.isFinite(r.total)||r.total<0||(previous&&r.id>=previous))throw new ApiError('No se pudo confirmar la venta.');previous=r.id;}
 if(raw.nextCursor!==null&&(raw.items.length!==20||raw.nextCursor!==raw.items[19].id))throw new ApiError('No se pudo confirmar la página de ventas.');return raw as {items:InvoiceSale[];nextCursor:string|null};
}
export async function createDraft(base:string,token:string,sale:InvoiceSale,input:{number:string;issueDate:string;dueDate:string;taxRate:number},signal?:AbortSignal){
 const number=input.number.trim().toUpperCase();if(!number||number.length>40||!date(input.issueDate)||!date(input.dueDate)||input.dueDate<input.issueDate||!Number.isFinite(input.taxRate)||input.taxRate<0||input.taxRate>100)throw new ApiError('Revisa número, fechas y tasa.',400);
 const raw:any=await requestData(base,'/invoices',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({...input,number,saleId:sale.id}),signal});
 const tax=Math.round(sale.total*input.taxRate)/100;const total=Math.round((sale.total+tax)*100)/100;
 if(!raw||!/^[a-f0-9]{24}$/i.test(raw.id)||raw.companyId!==sale.companyId||raw.branchId!==sale.branchId||raw.saleId!==sale.id||raw.customerId!==sale.customerId||raw.number!==number||raw.status!=='BORRADOR'||raw.issueDate!==input.issueDate||raw.dueDate!==input.dueDate||raw.subtotal!==sale.total||raw.taxRate!==input.taxRate||!Number.isFinite(raw.tax)||Math.abs(raw.tax-tax)>0.000001||!Number.isFinite(raw.total)||Math.abs(raw.total-total)>0.000001)throw new ApiError('No se pudo confirmar el borrador. Busca su número antes de reintentar.');return raw as Invoice;
}
export async function cancelDraft(base:string,token:string,row:Invoice,reason:string,signal?:AbortSignal){
 if(row.status!=='BORRADOR'||reason.trim().length<3||reason.trim().length>300)throw new ApiError('Escribe el motivo de cancelación.',400);
 const raw:any=await requestData(base,'/invoices/'+encodeURIComponent(row.id)+'/cancel',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({expectedUpdatedAt:row.updatedAt,reason:reason.trim()}),signal});
 if(!raw||raw.id!==row.id||raw.companyId!==row.companyId||raw.branchId!==row.branchId||raw.status!=='CANCELADA'||['number','saleId','customerId','subtotal','taxRate','tax','total','issueDate','dueDate'].some(k=>raw[k]!==row[k as keyof Invoice]))throw new ApiError('No se pudo confirmar la cancelación. Actualiza antes de reintentar.');return raw as Invoice;
}
