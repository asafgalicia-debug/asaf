import { describe, expect, it } from 'vitest';

import { getTraceabilitySummary } from '../src/modules/traceability/traceabilityService.js';

describe('traceability domain', () => {
  it('should expose batch coverage, serialization, and compliance status', () => {
    const summary = getTraceabilitySummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.batchCoverage).toBeGreaterThan(0);
    expect(summary.events.length).toBeGreaterThan(0);
    expect(summary.events.some((event) => event.location === 'Madrid Hub')).toBe(true);
  });
});
