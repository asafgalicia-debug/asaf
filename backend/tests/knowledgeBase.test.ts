import { describe, expect, it } from 'vitest';

import { getKnowledgeBaseSummary } from '../src/modules/knowledgeBase/knowledgeBaseService.js';

describe('knowledge base domain', () => {
  it('should expose article coverage, contribution health, and onboarding readiness for support teams', () => {
    const summary = getKnowledgeBaseSummary();

    expect(summary.service).toBe('erp-api');
    expect(summary.status).toBe('healthy');
    expect(summary.metrics.articleCoverage).toBeGreaterThan(0);
    expect(summary.articles.length).toBeGreaterThan(0);
    expect(summary.articles.some((article) => article.title === 'ERP onboarding guide')).toBe(true);
  });
});
