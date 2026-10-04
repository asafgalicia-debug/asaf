import {previewReport} from './reportPreview.js';
import { AppError } from '../../errors/AppError.js';
import { getProductModel } from '../productos/models/Product.js';
import { getWarehouseModel } from '../inventario/models/Warehouse.js';
import { getReportModel, type ReportPeriod, type ReportType } from './models/Report.js';

async function buildReportData(companyId: string, branchId: string, type: ReportType, period: ReportPeriod): Promise<Record<string, unknown>> {
  if(type!=='inventory'){
    const report=await previewReport(companyId,branchId,type==='sales'?'sales':'cash-flow',period);
    return {from:report.from,to:report.to,timezone:report.timezone,basis:report.basis,source:type==='sales'?'sales':'cashMovements',...report.metrics};
  }
  const [products, warehouses] = await Promise.all([
    getProductModel().countDocuments({ companyId, status: 'ACTIVE' }).exec(),
    getWarehouseModel().countDocuments({ companyId, branchId, status: 'ACTIVE' }).exec()
  ]);
  return { asOf:new Date().toISOString(), basis:'currentCatalog', periodApplied:false, activeProducts: products, activeWarehouses: warehouses };
}

function serialize(row: Record<string, any>): Record<string, unknown> {
  const { _id, ...rest } = row;
  return { id: String(_id), ...rest };
}

export async function listReports(companyId: string, branchId: string): Promise<Array<Record<string, unknown>>> {
  const rows = await getReportModel().find({ companyId, branchId }).sort({ createdAt: -1 }).lean().exec();
  return rows.map((row) => serialize(row as Record<string, any>));
}

export async function createReport(input: {
  companyId: string; branchId: string; userId: string; name: string;
  type: ReportType; period: ReportPeriod; filters?: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const companyId = input.companyId.trim();
  const branchId = input.branchId.trim();
  const userId = input.userId.trim();
  const name = input.name.trim();
  const types: ReportType[] = ['sales', 'cash-flow', 'inventory', 'financial'];
  const periods: ReportPeriod[] = ['day', 'week', 'month', 'quarter', 'year'];
  if (!companyId || !branchId || !userId || !name || name.length > 120 || !types.includes(input.type) || !periods.includes(input.period)) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid report input', friendlyMessage: 'Revisa el nombre, tipo y periodo del reporte.', statusCode: 400 });
  }
  if(input.filters && Object.keys(input.filters).length)throw new AppError({code:'VALIDATION_ERROR',message:'Unsupported report filters',friendlyMessage:'Este reporte todavía no admite filtros adicionales.',statusCode:400});
  const data = await buildReportData(companyId, branchId, input.type, input.period);
  const row = await getReportModel().create({
    companyId, branchId, userId, name, type: input.type, period: input.period,
    filters: input.filters ?? {}, data
  });
  return serialize(row.toObject() as Record<string, any>);
}
