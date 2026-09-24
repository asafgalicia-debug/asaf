export type KnowledgeArticle = {
  title: string;
  category: 'onboarding' | 'operations' | 'security';
  views: number;
  helpfulScore: number;
};

export type KnowledgeBaseSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    articleCoverage: number;
    activeAuthors: number;
    publishedArticles: number;
  };
  articles: KnowledgeArticle[];
};

export function getKnowledgeBaseSummary(): KnowledgeBaseSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      articleCoverage: 92.4,
      activeAuthors: 14,
      publishedArticles: 186
    },
    articles: [
      { title: 'ERP onboarding guide', category: 'onboarding', views: 1540, helpfulScore: 94 },
      { title: 'Inventory workflow playbook', category: 'operations', views: 812, helpfulScore: 89 },
      { title: 'Access control checklist', category: 'security', views: 610, helpfulScore: 96 }
    ]
  };
}
