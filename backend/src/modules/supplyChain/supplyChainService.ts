export type SupplyChainNode = {
  name: string;
  type: 'hub' | 'warehouse' | 'supplier';
  fulfillment: number;
  leadTime: number;
};

export type SupplyChainSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    fulfillmentRate: number;
    averageLeadTime: number;
    networkCoverage: number;
  };
  nodes: SupplyChainNode[];
};

export function getSupplyChainSummary(): SupplyChainSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      fulfillmentRate: 96.8,
      averageLeadTime: 4.6,
      networkCoverage: 92.1
    },
    nodes: [
      { name: 'Madrid Hub', type: 'hub', fulfillment: 98, leadTime: 3 },
      { name: 'Barcelona Warehouse', type: 'warehouse', fulfillment: 95, leadTime: 5 },
      { name: 'Valencia Supplier', type: 'supplier', fulfillment: 94, leadTime: 6 }
    ]
  };
}
