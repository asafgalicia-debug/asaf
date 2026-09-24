export type BusinessKpi = {
  name: string;
  value: number;
  delta: number;
  unit: string;
};

export type BusinessPrediction = {
  name: 'revenue' | 'inventory' | 'retention';
  score: number;
  trend: 'up' | 'down' | 'stable';
  note: string;
};

export type BusinessRecommendation = {
  title: string;
  impact: 'high' | 'medium' | 'low';
  reason: string;
};

export type BusinessIntelligenceSummary = {
  service: string;
  status: 'ready';
  kpis: BusinessKpi[];
  predictions: BusinessPrediction[];
  recommendations: BusinessRecommendation[];
};

export function getBusinessIntelligenceSummary(): BusinessIntelligenceSummary {
  return {
    service: 'erp-api',
    status: 'ready',
    kpis: [
      { name: 'revenue', value: 128400, delta: 12.5, unit: 'USD' },
      { name: 'grossMargin', value: 46.2, delta: 3.8, unit: '%' },
      { name: 'customerRetention', value: 89.4, delta: 2.1, unit: '%' }
    ],
    predictions: [
      { name: 'revenue', score: 92, trend: 'up', note: 'Ventas proyectadas superiores al promedio histórico.' },
      { name: 'inventory', score: 78, trend: 'stable', note: 'Existencias estables con tendencia de optimización.' },
      { name: 'retention', score: 85, trend: 'up', note: 'Retención mejorando por GTM y seguimiento.' }
    ],
    recommendations: [
      { title: 'Optimizar riesgo de stock crítico', impact: 'high', reason: 'Reducir faltantes en almacén y mejorar turnos operativos.' },
      { title: 'Reforzar campañas B2B', impact: 'medium', reason: 'Aumentar tasa de conversión en clientes con mayor valor.' }
    ]
  };
}
