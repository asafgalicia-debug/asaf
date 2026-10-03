import { z } from 'zod';
import { AppError } from '../errors/AppError.js';
const schema = z.object({ cursor: z.string().regex(/^[a-f0-9]{24}$/i).optional(), search: z.string().trim().max(100).default(''), limit: z.coerce.number().int().min(1).max(50).default(20) }).strict();
export type CatalogQuery = { cursor?: string; search: string; limit: number };
export function parseCatalogQuery(query: unknown): CatalogQuery { const parsed = schema.safeParse(query); if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid catalog page query', friendlyMessage: 'Revisa la búsqueda y la página del catálogo.', statusCode: 400 }); return parsed.data; }
export function catalogFilter(scope: { companyId: string; branchId?: string }, query: CatalogQuery, fields: string[]): Record<string, unknown> {
 const filter: Record<string, unknown> = { ...scope };
 if (query.cursor) filter._id = { $lt: query.cursor };
 if (query.search) { const slash = String.fromCharCode(92); const literal = Array.from(query.search).map(char => char === slash || '^$.*+?()[]{}|'.includes(char) ? slash + char : char).join(''); filter.$or = fields.map(field => ({ [field]: { $regex: literal, $options: 'i' } })); }
 return filter;
}
export function catalogSlice<T extends { _id: unknown }>(rows: T[], limit: number) { const selected = rows.slice(0, limit); return { items: selected.map(({ _id, ...row }) => ({ id: String(_id), ...row })), nextCursor: rows.length > limit && selected.length ? String(selected[selected.length - 1]._id) : null }; }
