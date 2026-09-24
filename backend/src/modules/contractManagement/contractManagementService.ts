export type ContractStatus = 'active' | 'renewal' | 'expired';

export type ContractItem = {
  vendor: string;
  status: ContractStatus;
  coverage: number;
  renewalDate: string;
};

export type ContractManagementSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    coverage: number;
    renewalRisk: number;
    compliant: number;
  };
  contracts: ContractItem[];
};

export function getContractManagementSummary(): ContractManagementSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      coverage: 94.7,
      renewalRisk: 12.4,
      compliant: 97.3
    },
    contracts: [
      { vendor: 'Northwind Supply', status: 'active', coverage: 98, renewalDate: '2026-11-28' },
      { vendor: 'BluePeak Logistics', status: 'renewal', coverage: 90, renewalDate: '2026-10-15' },
      { vendor: 'Orion Services', status: 'active', coverage: 95, renewalDate: '2026-12-08' }
    ]
  };
}
