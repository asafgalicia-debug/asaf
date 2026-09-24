export type BusinessProcess = {
  name: string;
  coverage: number;
  backupReady: boolean;
  owner: string;
};

export type BusinessContinuitySummary = {
  service: string;
  status: 'healthy';
  metrics: {
    coverage: number;
    resilienceScore: number;
    reviewCycle: string;
  };
  processes: BusinessProcess[];
};

export function getBusinessContinuitySummary(): BusinessContinuitySummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      coverage: 93.8,
      resilienceScore: 91.2,
      reviewCycle: 'quarterly'
    },
    processes: [
      { name: 'Finance', coverage: 97, backupReady: true, owner: 'CFO' },
      { name: 'Operations', coverage: 90, backupReady: true, owner: 'COO' },
      { name: 'Customer support', coverage: 88, backupReady: true, owner: 'CS Lead' }
    ]
  };
}
