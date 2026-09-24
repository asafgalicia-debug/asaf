import { describe, expect, it } from 'vitest';

import { createOpportunity, listOpportunities } from '../src/modules/crm/opportunityService.js';

describe('crm domain', () => {
  it('should list the demo opportunity for the company', () => {
    const opportunities = listOpportunities('company-demo-01');

    expect(opportunities.length).toBeGreaterThan(0);
    expect(opportunities[0].name).toBe('Oportunidad Demo');
  });

  it('should create a valid opportunity', () => {
    const opportunity = createOpportunity({
      companyId: 'company-demo-01',
      customerId: 'customer-demo-01',
      name: 'Nueva oportunidad',
      stage: 'QUALIFICATION',
      amount: 5000,
      status: 'OPEN'
    });

    expect(opportunity.name).toBe('Nueva oportunidad');
    expect(opportunity.amount).toBe(5000);
    expect(listOpportunities('company-demo-01').length).toBeGreaterThan(1);
  });
});
