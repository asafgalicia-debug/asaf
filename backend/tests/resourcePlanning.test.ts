import { describe, expect, it } from 'vitest';

import { getResourcePlanningSummary } from '../src/modules/resourcePlanning/resourcePlanningService.js';

describe('resource planning domain', () => {
  it('should expose workload balance, staffing utilization, and project capacity metrics', () => {
    const summary = getResourcePlanningSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.capacityUtilization).toBeGreaterThan(0);
    expect(summary.resources.length).toBeGreaterThan(0);
    expect(summary.resources.some((resource) => resource.name === 'Ana Ruiz')).toBe(true);
  });
});
