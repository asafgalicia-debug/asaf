import {getCashMovementModel} from '../finanzas/models/FinanceModels.js';
import {getSaleModel} from '../ventas/models/Sale.js';
import type {ReportPeriod} from './models/Report.js';
export function utcPeriodStart(period:ReportPeriod,now:Date){
 const start=new Date(now);start.setUTCHours(0,0,0,0);
 if(period==='week')start.setUTCDate(start.getUTCDate()-((start.getUTCDay()+6)%7));
 if(period==='month')start.setUTCDate(1);
 if(period==='quarter')start.setUTCMonth(Math.floor(start.getUTCMonth()/3)*3,1);
 if(period==='year')start.setUTCMonth(0,1);
 return start;
}
export async function previewReport(companyId:string,branchId:string,type:'sales'|'cash-flow',period:ReportPeriod,now=new Date()){
 const from=utcPeriodStart(period,now),scope={companyId,branchId};
 if(type==='sales'){
  const [row]=await getSaleModel().aggregate([{$match:{...scope,status:{$ne:'CANCELADA'},createdAt:{$gte:from,$lte:now}}},{$group:{_id:null,total:{$sum:'$total'},orders:{$sum:1},units:{$sum:'$quantity'}}}]).exec();
  return {companyId,branchId,type,period,from:from.toISOString(),to:now.toISOString(),timezone:'UTC',basis:'createdAt',metrics:{total:row?.total??0,orders:row?.orders??0,units:row?.units??0}};
 }
 const rows=await getCashMovementModel().aggregate([{$match:{...scope,type:{$in:['INFLOW','OUTFLOW']},date:{$gte:from.toISOString().slice(0,10),$lte:now.toISOString().slice(0,10)}}},{$group:{_id:'$type',total:{$sum:'$amount'},entries:{$sum:1}}}]).exec();
 const inflow=rows.find(r=>r._id==='INFLOW'),outflow=rows.find(r=>r._id==='OUTFLOW');
 return {companyId,branchId,type,period,from:from.toISOString(),to:now.toISOString(),timezone:'UTC',basis:'movementDate',metrics:{income:inflow?.total??0,expenses:outflow?.total??0,balance:(inflow?.total??0)-(outflow?.total??0),incomeEntries:inflow?.entries??0,expenseEntries:outflow?.entries??0}};
}
