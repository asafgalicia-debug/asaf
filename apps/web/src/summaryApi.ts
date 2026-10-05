import {ApiError,requestData} from './webApi';
export type Summary={companyId:string;branchId:string;lastUpdated:string;metrics:{sales:number;purchases:number;cash:number;employees:number;inventory:number}};
export async function summaryRequest(base:string,token:string,companyId:string,branchId:string,signal:AbortSignal):Promise<Summary>{
 const data=await requestData(base,'/dashboard/summary',{headers:{Authorization:'Bearer '+token},signal}) as Summary;
 if(!data||data.companyId!==companyId||data.branchId!==branchId||typeof data.lastUpdated!=='string'||!Number.isFinite(Date.parse(data.lastUpdated))||!data.metrics)throw new ApiError('El servidor devolvió un resumen inesperado.');
 for(const key of ['sales','purchases','cash','employees','inventory'] as const){const n=data.metrics[key];if(typeof n!=='number'||!Number.isFinite(n)||(key!=='cash'&&n<0)||(['employees','inventory'].includes(key)&&!Number.isSafeInteger(n)))throw new ApiError('El servidor devolvió indicadores inesperados.');}
 return data;
}
export const summaryLabels={sales:'Ventas no canceladas',purchases:'Compras no canceladas',cash:'Flujo neto de caja registrado',employees:'Empleados activos',inventory:'Productos activos del catálogo'};
export function summaryCsv(data:Summary){const quote=(v:unknown)=>'"'+String(v).replace(/"/g,'""')+'"';return '\ufeff'+[['Empresa',data.companyId],['Sucursal',data.branchId],['Actualizado',data.lastUpdated],['Indicador','Valor'],...Object.entries(summaryLabels).map(([key,label])=>[label,data.metrics[key as keyof Summary['metrics']]])].map(row=>row.map(quote).join(',')).join('\r\n');}
