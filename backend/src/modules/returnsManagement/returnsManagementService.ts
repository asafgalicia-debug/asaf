export type ReturnItem = {
  id: string;
  reason: 'Damaged in transit' | 'Customer preference' | 'Quality issue';
  quantity: number;
  recoveryValue: number;
};

export type ReturnsManagementSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    returnRate: number;
    recoveryRate: number;
    reverseLogisticsHealth: number;
  };
  items: ReturnItem[];
};

export function getReturnsManagementSummary(): ReturnsManagementSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      returnRate: 8.5,
      recoveryRate: 73.2,
      reverseLogisticsHealth: 89.1
    },
    items: [
      { id: 'RET-1001', reason: 'Damaged in transit', quantity: 22, recoveryValue: 1400 },
      { id: 'RET-1002', reason: 'Customer preference', quantity: 18, recoveryValue: 980 },
      { id: 'RET-1003', reason: 'Quality issue', quantity: 12, recoveryValue: 760 }
    ]
  };
}
