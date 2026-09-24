export type ResourceAssignment = {
  name: string;
  role: string;
  allocation: number;
  utilization: number;
  project: string;
};

export type ResourcePlanningSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    capacityUtilization: number;
    workloadBalance: number;
    projectCoverage: number;
  };
  resources: ResourceAssignment[];
};

export function getResourcePlanningSummary(): ResourcePlanningSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      capacityUtilization: 84.5,
      workloadBalance: 91.2,
      projectCoverage: 96.8
    },
    resources: [
      { name: 'Ana Ruiz', role: 'PM', allocation: 82, utilization: 88, project: 'ERP Migration' },
      { name: 'Luca Moreno', role: 'Developer', allocation: 90, utilization: 92, project: 'ERP Migration' },
      { name: 'Sofia Chen', role: 'Analyst', allocation: 70, utilization: 78, project: 'Finance Automation' }
    ]
  };
}
