import { describe, expect, it } from 'vitest';

import { getMaintenanceSummary } from '../src/modules/mantenimiento/maintenanceService.js';

describe('maintenance domain', () => {
  it('should expose asset availability, preventive work, and downtime risk metrics', () => {
    const summary = getMaintenanceSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.availability).toBeGreaterThan(0);
    expect(summary.assets.length).toBeGreaterThan(0);
    expect(summary.assets.some((asset) => asset.name === 'CNC-07')).toBe(true);
  });
});
