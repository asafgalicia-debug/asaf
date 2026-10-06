import {z} from 'zod';
import {AppError} from '../../errors/AppError.js';
const schema=z.object({status:z.enum(['SENT','READ']).optional(),cursor:z.string().regex(/^[a-f0-9]{24}$/i).optional(),limit:z.coerce.number().int().min(1).max(50).default(20)}).strict();
export type NotificationQuery=z.infer<typeof schema>;
export function parseNotificationQuery(query:unknown):NotificationQuery {
 const result=schema.safeParse(query);
 if(!result.success)throw new AppError({code:'VALIDATION_ERROR',message:'Invalid inbox query',friendlyMessage:'Revisa el filtro y la página de avisos.',statusCode:400});
 return result.data;
}
