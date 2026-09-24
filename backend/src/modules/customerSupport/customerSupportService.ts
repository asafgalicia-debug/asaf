export type SupportTeam = {
  name: string;
  queue: 'Tier 1' | 'Tier 2' | 'Escalations';
  utilization: number;
  sla: number;
};

export type CustomerSupportSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    openTickets: number;
    slaCompliance: number;
    backlogRisk: number;
  };
  supportTeams: SupportTeam[];
};

export function getCustomerSupportSummary(): CustomerSupportSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      openTickets: 128,
      slaCompliance: 96.8,
      backlogRisk: 13
    },
    supportTeams: [
      { name: 'Tier 1', queue: 'Tier 1', utilization: 81, sla: 97.5 },
      { name: 'Tier 2', queue: 'Tier 2', utilization: 72, sla: 94.6 },
      { name: 'Escalations', queue: 'Escalations', utilization: 58, sla: 98.1 }
    ]
  };
}
