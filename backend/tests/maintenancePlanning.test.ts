import { describe, expect, it } from 'vitest';

import { getMaintenancePlanningSummary } from '../src/modules/maintenancePlanning/maintenancePlanningService.js';

describe('maintenance planning domain', () => {
  it('should expose preventive coverage, risk index, uptime, and planned work orders', () => {
    const summary = getMaintenancePlanningSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.preventiveCoverage).toBeGreaterThan(0);
    expect(summary.metrics.riskIndex).toBeGreaterThan(0);
    expect(summary.metrics.estimatedUptime).toBeGreaterThan(0);
    expect(summary.nextMaintenanceWindow).toMatch(/\d{4}-\d{2}-\d{2}/);
    expect(summary.workOrders.length).toBeGreaterThan(0);
    expect(summary.workOrders.some((workOrder) => workOrder.asset === 'Conveyor A3')).toBe(true);
  });
});
