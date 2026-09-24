export type SustainabilityProgram = {
  name: string;
  status: 'active' | 'monitoring' | 'planned';
  target: number;
};

export type SustainabilitySummary = {
  service: string;
  status: 'healthy';
  metrics: {
    carbonIntensity: number;
    recyclingRate: number;
    energyEfficiency: number;
  };
  programs: SustainabilityProgram[];
};

export function getSustainabilitySummary(): SustainabilitySummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      carbonIntensity: 18.4,
      recyclingRate: 76.2,
      energyEfficiency: 91.7
    },
    programs: [
      { name: 'Zero Waste Logistics', status: 'active', target: 80 },
      { name: 'Solar Fleet Charging', status: 'monitoring', target: 65 },
      { name: 'Low Emission Warehouse', status: 'planned', target: 70 }
    ]
  };
}
