import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { getRoleModel } from './models/Role.js';
import { listRoles, type RoleRecord } from './roleService.js';

export const rolePageSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  search: z.string().trim().max(100).default('')
}).strict();

export async function pageCompanyRoles(companyId: string, permissions: string[], query: unknown) {
  const parsed = rolePageSchema.safeParse(query);
  if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid role page', friendlyMessage: 'Revisa la búsqueda y la página de roles.', statusCode: 400 });
  const { page, limit, search } = parsed.data;
  const allowed = new Set(permissions);
  const matchesSearch = (r: RoleRecord) => `${r.name} ${r.description}`.toLocaleLowerCase().includes(search.toLocaleLowerCase());
  const system = listRoles().filter(r => r.isSystem !== false && !r.companyId && r.permissions.every(p => allowed.has(p)) && matchesSearch(r)).map(r => ({ ...r, isSystem: true, isActive: true }));
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const filter = {
    companyId,
    isSystem: false,
    permissions: { $not: { $elemMatch: { $nin: permissions } } },
    ...(search ? { $or: [{ name: { $regex: escaped, $options: 'i' } }, { description: { $regex: escaped, $options: 'i' } }] } : {})
  };
  const Role = getRoleModel();
  const count = await Role.countDocuments(filter);
  const offset = (page - 1) * limit;
  const items: RoleRecord[] = system.slice(offset, offset + limit);
  if (items.length < limit) {
    const custom = await Role.find(filter).sort({ name: 1, _id: 1 }).skip(Math.max(0, offset - system.length)).limit(limit - items.length).lean().exec();
    items.push(...custom.map(r => ({ id: String(r._id), name: r.name, description: r.description, permissions: r.permissions, companyId: r.companyId, isSystem: false, isActive: r.isActive !== false, updatedAt: r.updatedAt.toISOString() })));
  }
  const total = system.length + count;
  return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
