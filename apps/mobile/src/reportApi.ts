import {requestData} from './api';
export type ReportType='sales'|'cash-flow';
export type ReportPeriod='day'|'week'|'month'|'quarter'|'year';
export type PeriodReportData={from:string;to:string;metrics:Record<string,number>};
export async function reportRequest(base:string,token:string,type:ReportType,period:ReportPeriod,scope:{companyId:string;branchId:string},signal:AbortSignal):Promise<PeriodReportData>{
 const value=await requestData(base,'/reports/preview?'+new URLSearchParams({type,period}),{headers:{Authorization:'Bearer '+token},signal});
 const v=value as Record<string,unknown>|null;const metrics=v?.metrics as Record<string,unknown>|undefined;const keys=type==='sales'?['total','orders','units']:['income','expenses','balance','incomeEntries','expenseEntries'];
 if(!v||v.companyId!==scope.companyId||v.branchId!==scope.branchId||v.type!==type||v.period!==period||v.timezone!=='UTC'||v.basis!==(type==='sales'?'createdAt':'movementDate')||typeof v.from!=='string'||typeof v.to!=='string'||!Number.isFinite(Date.parse(v.from))||!Number.isFinite(Date.parse(v.to))||Date.parse(v.from)>Date.parse(v.to)||!metrics||keys.some(k=>typeof metrics[k]!=='number'||!Number.isFinite(metrics[k])||(k!=='balance'&&(metrics[k] as number)<0)))throw new Error('Respuesta de reporte inesperada.');
 return {from:v.from,to:v.to,metrics:Object.fromEntries(keys.map(k=>[k,metrics[k] as number]))};
}
