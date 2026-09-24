export type AutomationFlow = {
  id: 'approval' | 'inventory' | 'billing' | 'followup';
  name: string;
  status: 'active';
  trigger: string;
};

export type AutomationSummary = {
  service: string;
  status: 'active';
  flows: AutomationFlow[];
  metrics: {
    executionsToday: number;
    successRate: number;
    avgRuntimeMs: number;
  };
};

export function getAutomationSummary(): AutomationSummary {
  return {
    service: 'erp-api',
    status: 'active',
    flows: [
      { id: 'approval', name: 'Aprobación de compras', status: 'active', trigger: 'nueva solicitud' },
      { id: 'inventory', name: 'Reorden de inventario', status: 'active', trigger: 'stock bajo' },
      { id: 'billing', name: 'Facturación automática', status: 'active', trigger: 'evento de venta' },
      { id: 'followup', name: 'Seguimiento de clientes', status: 'active', trigger: 'oportunidad sin respuesta' }
    ],
    metrics: {
      executionsToday: 48,
      successRate: 98.7,
      avgRuntimeMs: 420
    }
  };
}
