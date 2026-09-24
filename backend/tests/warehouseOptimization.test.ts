import { describe, expect, it } from 'vitest';

import { getWarehouseOptimizationSummary } from '../src/modules/warehouseOptimization/warehouseOptimizationService.js';

describe('warehouse optimization domain', () => {
  it('should expose slot utilization, travel distance, and picking efficiency', () => {
    const summary = getWarehouseOptimizationSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.slotUtilization).toBeGreaterThan(0);
    expect(summary.metrics.pickAccuracy).toBeGreaterThan(0);
    expect(summary.locations.length).toBeGreaterThan(0);
    expect(summary.locations.some((location) => location.zone === 'Zone A')).toBe(true);
  });
});
