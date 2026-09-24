import { AppError } from '../../errors/AppError.js';
import { getExpenseModel, getIncomeModel } from '../finanzas/models/FinanceModels.js';
import { getProductModel } from '../productos/models/Product.js';
import { getSaleModel } from '../ventas/models/Sale.js';
import { getWarehouseModel } from '../inventario/models/Warehouse.js';
import { getReportModel, type ReportPeriod, type ReportType } from './models/Report.js';

function periodStart(period: ReportPeriod, now = new Date()): Date {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === 'day') return start;
  if (period === 'week') {
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return start;
  }
  if (period === 'month') start.setDate(1);
  else if (period === 'quarter') {
    start.setMonth(Math.floor(start.getMonth() / 3) * 3, 1);
  } else if (period === 'year') start.setMonth(0, 1);
  return start;
}

async function buildReportData(companyId: string, branchId: string, type: ReportType, period: ReportPeriod): Promise<Record<string, unknown>> {
  const from = periodStart(period);
  const common = { companyId, branchId, createdAt: { $gte: from } };
  if (type === 'sales') {
    const [summary] = await getSaleModel().aggregate([
      { $match: { ...common, status: { $ne: 'CANCELADA' } } },
      { $group: { _id: null, total: { $sum: '$total' }, orders: { $sum: 1 }, units: { $sum: '$quantity' } } }
    ]).exec();
    return { from: from.toISOString(), total: summary?.total ?? 0, orders: summary?.orders ?? 0, units: summary?.units ?? 0 };
  }
  if (type === 'cash-flow' || type === 'financial') {
    const [income, expense] = await Promise.all([
      getIncomeModel().aggregate([
        { $match: { ...common, status: { $in: ['RECIBIDO', 'PAGADA'] } } },
        { $group: { _id: null, total: { $sum: '$amount' }, entries: { $sum: 1 } } }
      ]).exec(),
      getExpenseModel().aggregate([
        { $match: { ...common, status: 'PAGADA' } },
        { $group: { _id: null, total: { $sum: '$amount' }, entries: { $sum: 1 } } }
      ]).exec()
    ]);
    const incomeTotal = income[0]?.total ?? 0;
    const expenseTotal = expense[0]?.total ?? 0;
    return {
      from: from.toISOString(), income: incomeTotal, expenses: expenseTotal,
      balance: incomeTotal - expenseTotal,
      incomeEntries: income[0]?.entries ?? 0,
      expenseEntries: expense[0]?.entries ?? 0
    };
  }
  const [products, warehouses] = await Promise.all([
    getProductModel().countDocuments({ companyId, status: 'ACTIVE' }).exec(),
    getWarehouseModel().countDocuments({ companyId, branchId, status: 'ACTIVE' }).exec()
  ]);
  return { from: from.toISOString(), activeProducts: products, activeWarehouses: warehouses };
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
  const data = await buildReportData(companyId, branchId, input.type, input.period);
  const row = await getReportModel().create({
    companyId, branchId, userId, name, type: input.type, period: input.period,
    filters: input.filters ?? {}, data
  });
  return serialize(row.toObject() as Record<string, any>);
}
