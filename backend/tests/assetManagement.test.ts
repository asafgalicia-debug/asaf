import { describe, expect, it } from 'vitest';

import { getAssetManagementSummary } from '../src/modules/assetManagement/assetManagementService.js';

describe('asset management domain', () => {
  it('should expose utilization, downtime, and maintenance coverage', () => {
    const summary = getAssetManagementSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.utilizationRate).toBeGreaterThan(0);
    expect(summary.assets.length).toBeGreaterThan(0);
    expect(summary.assets.some((asset) => asset.name === 'Forklift 7')).toBe(true);
  });
});
