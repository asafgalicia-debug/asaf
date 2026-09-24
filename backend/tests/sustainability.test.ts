import { describe, expect, it } from 'vitest';

import { getSustainabilitySummary } from '../src/modules/sustainability/sustainabilityService.js';

describe('sustainability domain', () => {
  it('should expose carbon, waste, and energy metrics', () => {
    const summary = getSustainabilitySummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.carbonIntensity).toBeGreaterThan(0);
    expect(summary.metrics.recyclingRate).toBeGreaterThan(0);
    expect(summary.programs.length).toBeGreaterThan(0);
    expect(summary.programs.some((program) => program.name === 'Zero Waste Logistics')).toBe(true);
  });
});
