import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';

const schema = z.object({
  search: z.string().trim().max(100).default(''),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  cursor: z.string().regex(/^[a-f0-9]{24}$/i).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20)
}).strict();

export type UserPageQuery = z.infer<typeof schema>;

export function parseUserPageQuery(query: unknown): UserPageQuery {
  const parsed = schema.safeParse(query);
  if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid user page query', friendlyMessage: 'Revisa la búsqueda y la página de usuarios.', statusCode: 400 });
  return parsed.data;
}
