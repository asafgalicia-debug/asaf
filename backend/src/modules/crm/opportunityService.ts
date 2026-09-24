import { AppError } from '../../errors/AppError.js';

export type OpportunityStage = 'QUALIFICATION' | 'PROPOSAL' | 'NEGOTIATION' | 'CLOSED_WON' | 'CLOSED_LOST';
export type OpportunityStatus = 'OPEN' | 'WON' | 'LOST';

export type OpportunityRecord = {
  id: string;
  companyId: string;
  customerId: string;
  name: string;
  stage: OpportunityStage;
  amount: number;
  status: OpportunityStatus;
};

const opportunities: Record<string, OpportunityRecord> = {
  'opportunity-demo-01': {
    id: 'opportunity-demo-01',
    companyId: 'company-demo-01',
    customerId: 'customer-demo-01',
    name: 'Oportunidad Demo',
    stage: 'QUALIFICATION',
    amount: 7500,
    status: 'OPEN'
  }
};

export function listOpportunities(companyId: string): OpportunityRecord[] {
  return Object.values(opportunities).filter((opportunity) => opportunity.companyId === companyId);
}

export function createOpportunity(input: {
  companyId: string;
  customerId: string;
  name: string;
  stage: OpportunityStage;
  amount: number;
  status: OpportunityStatus;
}): OpportunityRecord {
  const companyId = input.companyId.trim();
  const customerId = input.customerId.trim();
  const name = input.name.trim();

  if (!companyId || !customerId || !name || Number.isNaN(input.amount) || input.amount <= 0) {
    throw new AppError({
      code: 'VALIDATION_ERROR',
      message: 'Oportunidad incompleta',
      friendlyMessage: 'Debe indicar cliente, nombre y monto válidos.',
      statusCode: 400
    });
  }

  const opportunity: OpportunityRecord = {
    id: `opportunity-${Date.now()}`,
    companyId,
    customerId,
    name,
    stage: input.stage,
    amount: Number(input.amount),
    status: input.status
  };

  opportunities[opportunity.id] = opportunity;
  return opportunity;
}
