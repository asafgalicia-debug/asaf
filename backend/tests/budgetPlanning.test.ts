import { describe, expect, it } from 'vitest';

import { getBudgetPlanningSummary } from '../src/modules/budgetPlanning/budgetPlanningService.js';

describe('budget planning domain', () => {
  it('should expose budget health, forecast variance, and department coverage', () => {
    const summary = getBudgetPlanningSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.forecastVariance).toBeGreaterThan(0);
    expect(summary.departments.length).toBeGreaterThan(0);
    expect(summary.departments.some((department) => department.name === 'Operations')).toBe(true);
  });
});
