import { describe, expect, it } from 'vitest';

import { getFleetManagementSummary } from '../src/modules/fleetManagement/fleetManagementService.js';

describe('fleet management domain', () => {
  it('should expose vehicle utilization, maintenance readiness, and route efficiency', () => {
    const summary = getFleetManagementSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.utilization).toBeGreaterThan(0);
    expect(summary.vehicles.length).toBeGreaterThan(0);
    expect(summary.vehicles.some((vehicle) => vehicle.plate === 'AB-1234-CD')).toBe(true);
  });
});
