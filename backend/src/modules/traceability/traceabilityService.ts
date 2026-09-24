export type TraceabilityEvent = {
  id: string;
  location: string;
  status: 'registered' | 'in_transit' | 'verified';
  compliance: number;
};

export type TraceabilitySummary = {
  service: string;
  status: 'healthy';
  metrics: {
    batchCoverage: number;
    serializationRate: number;
    complianceScore: number;
  };
  events: TraceabilityEvent[];
};

export function getTraceabilitySummary(): TraceabilitySummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      batchCoverage: 98.6,
      serializationRate: 94.3,
      complianceScore: 99.1
    },
    events: [
      { id: 'TR-1001', location: 'Madrid Hub', status: 'verified', compliance: 99 },
      { id: 'TR-1002', location: 'Barcelona Warehouse', status: 'in_transit', compliance: 95 },
      { id: 'TR-1003', location: 'Valencia Supplier', status: 'registered', compliance: 92 }
    ]
  };
}
