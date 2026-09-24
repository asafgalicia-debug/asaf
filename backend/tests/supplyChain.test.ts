import { describe, expect, it } from 'vitest';

import { getSupplyChainSummary } from '../src/modules/supplyChain/supplyChainService.js';

describe('supply chain domain', () => {
  it('should expose fulfillment rate, lead times, and network coverage', () => {
    const summary = getSupplyChainSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.fulfillmentRate).toBeGreaterThan(0);
    expect(summary.nodes.length).toBeGreaterThan(0);
    expect(summary.nodes.some((node) => node.name === 'Madrid Hub')).toBe(true);
  });
});
