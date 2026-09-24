export type QualityInspection = {
  line: string;
  status: 'pass' | 'watch' | 'fail';
  defectRate: number;
  firstPass: number;
};

export type QualitySummary = {
  service: string;
  status: 'healthy';
  metrics: {
    firstPassYield: number;
    defectRate: number;
    compliance: number;
  };
  inspections: QualityInspection[];
};

export function getQualitySummary(): QualitySummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      firstPassYield: 96.4,
      defectRate: 1.8,
      compliance: 98.9
    },
    inspections: [
      { line: 'Assembly A', status: 'pass', defectRate: 1.2, firstPass: 97.3 },
      { line: 'Packaging', status: 'watch', defectRate: 2.1, firstPass: 94.8 },
      { line: 'Final QA', status: 'pass', defectRate: 1.5, firstPass: 96.9 }
    ]
  };
}
