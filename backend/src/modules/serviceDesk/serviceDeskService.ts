export type QueueStatus = {
  name: string;
  active: number;
  avgResponse: number;
  firstResponse: number;
};

export type ServiceDeskSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    activeIncidents: number;
    mttr: number;
    slaCompliance: number;
  };
  queues: QueueStatus[];
};

export function getServiceDeskSummary(): ServiceDeskSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      activeIncidents: 23,
      mttr: 4.2,
      slaCompliance: 97.4
    },
    queues: [
      { name: 'Priority', active: 6, avgResponse: 21, firstResponse: 12 },
      { name: 'Standard', active: 11, avgResponse: 48, firstResponse: 31 },
      { name: 'Escalations', active: 6, avgResponse: 83, firstResponse: 44 }
    ]
  };
}
