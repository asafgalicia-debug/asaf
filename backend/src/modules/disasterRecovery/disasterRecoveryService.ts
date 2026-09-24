export type RecoveryPlan = {
  name: string;
  backupStatus: 'healthy' | 'warning';
  rpo: number;
  rto: number;
};

export type DisasterRecoverySummary = {
  service: string;
  status: 'healthy';
  metrics: {
    recoveryReadiness: number;
    backupCoverage: number;
    lastTest: string;
  };
  plans: RecoveryPlan[];
};

export function getDisasterRecoverySummary(): DisasterRecoverySummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      recoveryReadiness: 94.5,
      backupCoverage: 98.7,
      lastTest: '2026-09-18'
    },
    plans: [
      { name: 'Core ERP', backupStatus: 'healthy', rpo: 30, rto: 90 },
      { name: 'Finance', backupStatus: 'healthy', rpo: 15, rto: 60 },
      { name: 'Warehouse', backupStatus: 'warning', rpo: 60, rto: 120 }
    ]
  };
}
