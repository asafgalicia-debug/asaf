import { AppError } from '../../errors/AppError.js';
import { getAIInsightModel } from './models/AIInsight.js';
import type { AIInsightKind } from './models/AIInsight.js';

const kinds: AIInsightKind[] = ['forecast', 'anomaly', 'recommendation', 'summary'];
const sensitiveKey = /(password|passwd|secret|token|api[-_]?key|authorization|credential)/i;
function validateInputData(data: Record<string, unknown>): void {
  if (!data || typeof data !== 'object' || Array.isArray(data) || Buffer.byteLength(JSON.stringify(data), 'utf8') > 20000) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid AI input data', friendlyMessage: 'Los datos de anÃ¡lisis deben ser un objeto de hasta 20 KB.', statusCode: 400 });
  }
  const visit = (value: unknown, depth: number): void => {
    if (depth > 5) throw new AppError({ code: 'VALIDATION_ERROR', message: 'AI input too deep', friendlyMessage: 'Los datos de anÃ¡lisis tienen demasiados niveles.', statusCode: 400 });
    if (!value || typeof value !== 'object') return;
    for (const [key, child] of Object.entries(value)) {
      if (sensitiveKey.test(key)) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Secret fields are not accepted', friendlyMessage: 'No incluyas contraseÃ±as, tokens ni credenciales en la solicitud.', statusCode: 400 });
      visit(child, depth + 1);
    }
  };
  visit(data, 0);
}

function serialize(row: Record<string, any>): Record<string, unknown> {
  const { _id, ...rest } = row;
  return { id: String(_id), ...rest };
}

export async function listAIInsights(companyId: string, branchId: string, userId: string): Promise<Array<Record<string, unknown>>> {
  const rows = await getAIInsightModel().find({ companyId, branchId, userId }).sort({ createdAt: -1 }).lean().exec();
  return rows.map((row) => serialize(row as Record<string, any>));
}

export async function createAIInsight(input: {
  companyId: string; branchId: string; userId: string; kind: AIInsightKind; title: string; data?: Record<string, unknown>;
}): Promise<Record<string, unknown>> {
  const companyId = input.companyId.trim();
  const branchId = input.branchId.trim();
  const userId = input.userId.trim();
  const title = input.title.trim();
  const data = input.data ?? {};
  if (!companyId || !branchId || !userId || !title || title.length > 120 || !kinds.includes(input.kind)) {
    throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid AI request', friendlyMessage: 'Revisa el tipo y tÃ­tulo de la solicitud.', statusCode: 400 });
  }
  validateInputData(data);
  const row = await getAIInsightModel().create({ companyId, branchId, userId, kind: input.kind, title, inputData: data, status: 'PENDING', approved: false });
  return serialize(row.toObject() as Record<string, any>);
}
