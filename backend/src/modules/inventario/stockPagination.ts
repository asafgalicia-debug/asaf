import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
const schema = z.object({ search: z.string().trim().max(100).default(''), cursor: z.string().regex(/^[a-f0-9]{24}:[a-f0-9]{24}$/i).optional(), limit: z.coerce.number().int().min(1).max(50).default(20) }).strict();
export type StockPageQuery = z.infer<typeof schema>;
export function parseStockPageQuery(input: unknown): StockPageQuery {
 const parsed = schema.safeParse(input);
 if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid stock page query', friendlyMessage: 'Revisa la búsqueda y la página de existencias.', statusCode: 400 });
 return parsed.data;
}
export function stockSearchLiteral(search: string) { return search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
