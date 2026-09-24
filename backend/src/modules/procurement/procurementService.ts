export type ProcurementOrder = {
  supplier: string;
  status: 'pending' | 'in_transit' | 'received';
  leadTimeDays: number;
  spend: number;
};

export type ProcurementSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    supplierScore: number;
    leadTime: number;
    spendCoverage: number;
  };
  orders: ProcurementOrder[];
};

export function getProcurementSummary(): ProcurementSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      supplierScore: 91.2,
      leadTime: 8.4,
      spendCoverage: 87.3
    },
    orders: [
      { supplier: 'Northwind Supply', status: 'in_transit', leadTimeDays: 7, spend: 4200 },
      { supplier: 'Bluepeak Logistics', status: 'pending', leadTimeDays: 10, spend: 3100 },
      { supplier: 'Crest Mfg', status: 'received', leadTimeDays: 5, spend: 2700 }
    ]
  };
}
