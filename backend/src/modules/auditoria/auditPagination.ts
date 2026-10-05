import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
const schema=z.object({limit:z.coerce.number().int().min(1).max(100).default(20),cursor:z.string().regex(/^[a-f0-9]{24}$/i).optional(),module:z.string().trim().min(1).max(80).optional(),action:z.enum(['LOGIN','LOGOUT','CREATE','UPDATE','DELETE','APPROVE']).optional()}).strict();
export type AuditQuery=z.infer<typeof schema>;
export function parseAuditQuery(raw:unknown):AuditQuery{const parsed=schema.safeParse(raw);if(!parsed.success)throw new AppError({code:'VALIDATION_ERROR',message:'Invalid audit filters',friendlyMessage:'Revisa módulo, acción y página de auditoría.',statusCode:400});return parsed.data;}
