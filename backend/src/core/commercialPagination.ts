import { z } from 'zod';
import { AppError } from '../errors/AppError.js';
export type CommercialQuery = { cursor?: string; limit: number; status?: string };
export function parseCommercialQuery(query: unknown, kind: 'sales' | 'purchase-orders'): CommercialQuery {
 const schema = z.object({ cursor: z.string().regex(/^[a-f0-9]{24}$/i).optional(), limit: z.coerce.number().int().min(1).max(50).default(20), status: z.enum(kind === 'sales' ? ['PENDIENTE','PAGADA','CANCELADA'] : ['PENDIENTE','APROBADA','RECIBIDA','CANCELADA']).optional() }).strict();
 const parsed = schema.safeParse(query); if (!parsed.success) throw new AppError({code:'VALIDATION_ERROR',message:'Invalid commercial page query',friendlyMessage:'Revisa el estado y la página solicitada.',statusCode:400}); return parsed.data;
}
export function commercialFilter(companyId: string, branchId: string, query: CommercialQuery): Record<string, unknown> { return { companyId, branchId, ...(query.cursor ? { _id: { $lt: query.cursor } } : {}), ...(query.status ? { status: query.status } : {}) }; }
