import { getSaleModel } from '../ventas/models/Sale.js';
import { getPurchaseOrderModel } from '../compras/models/PurchaseOrder.js';
import { getCashMovementModel } from '../finanzas/models/FinanceModels.js';
import { getEmployeeModel } from '../recursos-humanos/models/Employee.js';
import { getProductModel } from '../productos/models/Product.js';

export type DashboardSummary = {
  companyId: string;
  branchId: string;
  metrics: { sales: number; purchases: number; cash: number; employees: number; inventory: number };
  lastUpdated: string;
};

export async function getDashboardSummary(companyId: string, branchId: string): Promise<DashboardSummary> {
  const scope = { companyId, branchId };
  const [sales, purchases, cash, employees, inventory] = await Promise.all([
    getSaleModel().aggregate<{ value: number }>([
      { $match: { ...scope, status: { $ne: 'CANCELADA' } } },
      { $group: { _id: null, value: { $sum: '$total' } } }
    ]).exec(),
    getPurchaseOrderModel().aggregate<{ value: number }>([
      { $match: { ...scope, status: { $ne: 'CANCELADA' } } },
      { $group: { _id: null, value: { $sum: '$total' } } }
    ]).exec(),
    getCashMovementModel().aggregate<{ value: number }>([
      { $match: { ...scope, type: { $in: ['INFLOW', 'OUTFLOW'] } } },
      { $group: { _id: null, value: { $sum: { $cond: [{ $eq: ['$type', 'INFLOW'] }, '$amount', { $multiply: ['$amount', -1] }] } } } }
    ]).exec(),
    getEmployeeModel().countDocuments({ ...scope, status: 'ACTIVE' }).exec(),
    // Catalog products are company-wide; this is not a stock balance.
    getProductModel().countDocuments({ companyId, status: 'ACTIVE' }).exec()
  ]);
  return { companyId, branchId, metrics: {
    sales: sales[0]?.value ?? 0, purchases: purchases[0]?.value ?? 0,
    cash: cash[0]?.value ?? 0, employees, inventory
  }, lastUpdated: new Date().toISOString() };
}

export async function listDashboardWidgets(companyId: string, branchId: string) {
  const { metrics } = await getDashboardSummary(companyId, branchId);
  return [
    { id: 'widget-sales', name: 'ventas', title: 'Ventas no canceladas', value: metrics.sales },
    { id: 'widget-finance', name: 'finanzas', title: 'Flujo neto registrado', value: metrics.cash },
    { id: 'widget-inventory', name: 'inventario', title: 'Productos activos del catálogo', value: metrics.inventory }
  ];
}
