export type WarrantyClaim = {
  asset: string;
  status: 'open' | 'approved' | 'closed';
  replacementCost: number;
  coverage: number;
};

export type WarrantyManagementSummary = {
  service: string;
  status: 'healthy';
  metrics: {
    claimsRate: number;
    coverageRate: number;
    replacementRate: number;
  };
  claims: WarrantyClaim[];
};

export function getWarrantyManagementSummary(): WarrantyManagementSummary {
  return {
    service: 'erp-api',
    status: 'healthy',
    metrics: {
      claimsRate: 6.7,
      coverageRate: 92.5,
      replacementRate: 14.2
    },
    claims: [
      { asset: 'Luna Desk', status: 'approved', replacementCost: 920, coverage: 96 },
      { asset: 'Atlas Chair', status: 'open', replacementCost: 460, coverage: 88 },
      { asset: 'Nexa Shelf', status: 'closed', replacementCost: 680, coverage: 90 }
    ]
  };
}
