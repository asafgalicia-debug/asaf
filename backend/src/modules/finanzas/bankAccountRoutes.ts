import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { logAuditEvent } from '../../audit/auditLogger.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createBankAccount, listBankAccounts } from './bankAccountService.js';
const schema = z.object({ name: z.string().trim().min(2).max(100), bankName: z.string().trim().min(2).max(100), iban: z.string().trim().min(8).max(34) }).strict();
function scope(req: Request): { companyId: string; branchId: string; userId: string } { const t = req.tenant; if (!t?.companyId || !t.branchId || !t.userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context missing', friendlyMessage: 'La sesion no tiene empresa y sucursal activas.', statusCode: 401 }); return { companyId: t.companyId, branchId: t.branchId, userId: t.userId }; }
export function createBankAccountRoutes(): Router {
  const router = Router();
  router.get('/', authenticate, tenant, authorize('usuarios.ver'), async (req, res, next) => { try { const s = scope(req); res.json({ ok: true, data: await listBankAccounts(s.companyId, s.branchId) }); } catch (error) { next(error); } });
  router.post('/', authenticate, tenant, authorize('usuarios.editar'), async (req, res, next) => { try { const s = scope(req); const parsed = schema.safeParse(req.body); if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid finance data', friendlyMessage: 'Revisa los datos financieros ingresados.', statusCode: 400 }); const row = await createBankAccount({ name: parsed.data.name, bankName: parsed.data.bankName, iban: parsed.data.iban, companyId: s.companyId, branchId: s.branchId }); await logAuditEvent({ userId: s.userId, companyId: s.companyId, branchId: s.branchId, action: 'CREATE', module: 'finanzas.cuentas', entityId: row.id, details: {}, ipAddress: req.ip }); res.status(201).json({ ok: true, data: row }); } catch (error) { next(error); } });
  return router;
}