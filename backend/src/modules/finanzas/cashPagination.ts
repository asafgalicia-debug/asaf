import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
const schema=z.object({cursor:z.string().regex(/^[a-f0-9]{24}$/i).optional(),search:z.string().trim().max(100).default(''),limit:z.coerce.number().int().min(1).max(50).default(20),type:z.enum(['INFLOW','OUTFLOW']).optional(),accountId:z.string().regex(/^[a-f0-9]{24}$/i).optional()}).strict();
export type CashQuery=z.infer<typeof schema>;
export function parseCashQuery(value:unknown):CashQuery {const result=schema.safeParse(value);if(!result.success)throw new AppError({code:'VALIDATION_ERROR',message:'Invalid cash page',friendlyMessage:'Revisa la búsqueda y los filtros de caja.',statusCode:400});return result.data;}
