import { describe, expect, it } from 'vitest';

import { getPartnerPortalSummary } from '../src/modules/partnerPortal/partnerPortalService.js';

describe('partner portal domain', () => {
  it('should expose coalition metrics, partner health, and access state', () => {
    const summary = getPartnerPortalSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('ready');
    expect(summary.partners.length).toBeGreaterThan(0);
    expect(summary.metrics.activePartners).toBeGreaterThan(0);
    expect(summary.partners.some((partner) => partner.name === 'Northwind')).toBe(true);
  });
});
