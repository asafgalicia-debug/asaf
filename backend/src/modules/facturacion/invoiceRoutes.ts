import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createAuditedInvoice, listInvoices, parseInvoicePage, pageInvoices, cancelInvoiceDraft, parseInvoiceSaleOptions, invoiceSaleOptions } from './invoiceService.js';
const schema = z.object({ saleId: z.string().regex(/^[a-f0-9]{24}$/i), number: z.string().trim().min(1).max(40), issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), taxRate: z.number().finite().min(0).max(100) }).strict();
function scope(req: Request): { companyId: string; branchId: string; userId: string } { const t = req.tenant; if (!t?.companyId || !t.branchId || !t.userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context missing', friendlyMessage: 'La sesion no tiene empresa y sucursal activas.', statusCode: 401 }); return { companyId: t.companyId, branchId: t.branchId, userId: t.userId }; }
export function createInvoiceRoutes(): Router {
  const router = Router();
  router.get('/', authenticate, tenant, authorize('usuarios.ver'), async (req, res, next) => { try { const s = scope(req); res.json({ ok: true, data: await listInvoices(s.companyId, s.branchId) }); } catch (error) { next(error); } });
  router.get('/page', authenticate, tenant, authorize('usuarios.ver'), async (req, res, next) => { try { const s=scope(req); res.json({ok:true,data:await pageInvoices(s.companyId,s.branchId,parseInvoicePage(req.query))}); } catch(error) { next(error); } });
  router.get('/sale-options',authenticate,tenant,authorize('usuarios.editar'),async(req,res,next)=>{try{const s=scope(req);res.json({ok:true,data:await invoiceSaleOptions(s.companyId,s.branchId,parseInvoiceSaleOptions(req.query))});}catch(error){next(error);}});
  router.post('/', authenticate, tenant, authorize('usuarios.editar'), async (req, res, next) => { try { const s = scope(req); const parsed = schema.safeParse(req.body); if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid invoice draft data', friendlyMessage: 'Revisa venta, numero, fechas y tasa del borrador.', statusCode: 400 }); const row = await createAuditedInvoice({ ...parsed.data, companyId: s.companyId, branchId: s.branchId }, { userId: s.userId, ipAddress: req.ip }); res.status(201).json({ ok: true, data: row }); } catch (error) { next(error); } });
  router.post('/:id/cancel', authenticate, tenant, authorize('usuarios.editar'), async (req,res,next)=>{try{const s=scope(req);res.json({ok:true,data:await cancelInvoiceDraft(s.companyId,s.branchId,String(req.params.id),req.body,{userId:s.userId,ipAddress:req.ip})});}catch(error){next(error);}});
  return router;
}