import { describe, expect, it } from 'vitest';

import { getObservabilitySummary } from '../src/modules/observability/observabilityService.js';

describe('observability domain', () => {
  it('should expose service health, metrics, and alert readiness', () => {
    const summary = getObservabilitySummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.uptimeSeconds).toBeGreaterThan(0);
    expect(summary.metrics.memoryUsageMb).toBeGreaterThan(0);
    expect(summary.alerts.length).toBeGreaterThan(0);
    expect(summary.alerts.some((alert) => alert.level === 'info')).toBe(true);
  });
});
