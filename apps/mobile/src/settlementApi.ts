import {ApiError,requestData} from './api';
import type {Transaction,TransactionKind} from './transactionApi';
export async function settlementRequest(base:string,token:string,kind:TransactionKind,row:Transaction,input:{warehouseId:string;accountId:string;date:string},scope:{companyId:string;branchId:string},signal:AbortSignal){
 const hex=/^[a-f0-9]{24}$/i;
 if(![row.id,input.warehouseId,input.accountId].every(v=>hex.test(v))||row.total<=0||!Number.isSafeInteger(Math.round(row.total*100))||!/^\d{4}-\d{2}-\d{2}$/.test(input.date)||!Number.isFinite(Date.parse(input.date+'T00:00:00Z'))||new Date(input.date+'T00:00:00Z').toISOString().slice(0,10)!==input.date)throw new ApiError('Revisa almacén, cuenta, fecha e importe positivo.');
 try{
  const value=await requestData(base,'/commercial-settlements',{method:'POST',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({kind,sourceId:row.id,...input}),signal});const v=value as any;
  if(!v||![v.id,v.stockMovementId,v.cashMovementId].every(id=>typeof id==='string'&&hex.test(id))||v.companyId!==scope.companyId||v.branchId!==scope.branchId||v.kind!==kind||v.sourceId!==row.id||v.warehouseId!==input.warehouseId||v.accountId!==input.accountId||v.date!==input.date||v.total!==row.total||v.quantity!==row.quantity||v.status!==(kind==='sales'?'PAGADA':'RECIBIDA'))throw new ApiError('Comprobante inesperado.');
  return v.id as string;
 }catch(e){if(e instanceof ApiError&&e.status>=400&&e.status<500)throw e;throw new ApiError('No se pudo confirmar la operación. Reintenta con el mismo documento, almacén, cuenta y fecha; el servidor evita duplicados.');}
}

export type CommercialReceipt={id:string;warehouseId:string;accountId:string;stockMovementId:string;cashMovementId:string;date:string;quantity:number;total:number;status:string};
export async function receiptRequest(base:string,token:string,kind:TransactionKind,row:Transaction,scope:{companyId:string;branchId:string},signal:AbortSignal):Promise<CommercialReceipt>{
 const hex=/^[a-f0-9]{24}$/i;if(!hex.test(row.id))throw new ApiError('Identificador de documento inválido.');
 const value=await requestData(base,'/commercial-settlements?'+new URLSearchParams({kind,sourceId:row.id}),{headers:{Authorization:'Bearer '+token},signal});const v=value as any;
 if(!v||![v.id,v.warehouseId,v.accountId,v.stockMovementId,v.cashMovementId].every(id=>typeof id==='string'&&hex.test(id))||v.companyId!==scope.companyId||v.branchId!==scope.branchId||v.kind!==kind||v.sourceId!==row.id||v.total!==row.total||v.quantity!==row.quantity||v.status!==(kind==='sales'?'PAGADA':'RECIBIDA')||typeof v.date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v.date)||!Number.isFinite(Date.parse(v.date+'T00:00:00Z'))||new Date(v.date+'T00:00:00Z').toISOString().slice(0,10)!==v.date)throw new ApiError('Comprobante inesperado. Actualiza el listado y vuelve a consultar.');
 return {id:v.id,warehouseId:v.warehouseId,accountId:v.accountId,stockMovementId:v.stockMovementId,cashMovementId:v.cashMovementId,date:v.date,quantity:v.quantity,total:v.total,status:v.status};
}
