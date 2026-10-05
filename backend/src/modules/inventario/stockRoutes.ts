import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenant } from '../../middleware/tenant.js';
import { authorize } from '../../middleware/authorize.js';
import { listStock, pageStock, pageStockAlerts, receiveStock, issueStock, transferStock } from './stockService.js';
import { parseStockPageQuery } from './stockPagination.js';
import { listStockHistory } from './stockHistoryService.js';
const schema = z.object({ warehouseId: z.string().regex(/^[a-f\d]{24}$/i), productId: z.string().regex(/^[a-f\d]{24}$/i), quantity: z.number().finite().min(0.000001), reference: z.string().trim().min(1).max(100) }).strict();
export function createStockRoutes() {
  const router = Router();
  router.use(authenticate, tenant);
  router.get('/alerts',authorize('usuarios.ver'),async(req,res,next)=>{try{const companyId=req.tenant?.companyId,branchId=req.tenant?.branchId;if(!companyId||!branchId)throw new AppError({code:'UNAUTHORIZED',message:'Missing scope',friendlyMessage:'La sesión requiere empresa y sucursal.',statusCode:401});res.json({ok:true,data:await pageStockAlerts(companyId,branchId,parseStockPageQuery(req.query))});}catch(e){next(e);}});
  router.get('/page', authorize('usuarios.ver'), async (req, res, next) => {
    try {
      const { companyId, branchId } = req.tenant!;
      if (!companyId || !branchId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Missing tenant', friendlyMessage: 'La sesión requiere empresa y sucursal.', statusCode: 401 });
      res.json({ ok: true, data: await pageStock(companyId, branchId, parseStockPageQuery(req.query)) });
    } catch (error) { next(error); }
  });
  router.get('/movements', authorize('usuarios.ver'), async (req, res, next) => {
    try {
      const { companyId, branchId } = req.tenant!;
      if (!companyId || !branchId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Missing tenant', friendlyMessage: 'La sesión requiere empresa y sucursal.', statusCode: 401 });
      const parsed = z.object({
        limit: z.coerce.number().int().min(1).max(100).optional(),
        cursor: z.string().regex(/^[a-f\d]{24}$/i).optional(),
        reference: z.string().trim().min(1).max(100).optional()
      }).strict().safeParse(req.query);
      if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid history query', friendlyMessage: 'Revisa los filtros del historial.', statusCode: 400 });
      res.json({ ok: true, data: await listStockHistory(companyId, branchId, parsed.data) });
    } catch (error) { next(error); }
  });
  router.get('/', authorize('usuarios.ver'), async (req, res, next) => {
    try {
      const { companyId, branchId } = req.tenant!;
      if (!companyId || !branchId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Missing tenant', friendlyMessage: 'La sesión requiere empresa y sucursal.', statusCode: 401 });
      res.json({ ok: true, data: await listStock(companyId, branchId) });
    } catch (error) { next(error); }
  });
  for (const [path, record] of [['/receipts', receiveStock], ['/issues', issueStock]] as const) {
  router.post(path, authorize('usuarios.editar'), async (req, res, next) => {
    try {
      const { companyId, branchId, userId } = req.tenant!;
      if (!companyId || !branchId || !userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Missing tenant', friendlyMessage: 'La sesión requiere empresa y sucursal.', statusCode: 401 });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid receipt', friendlyMessage: 'Revisa almacén, producto, cantidad y referencia.', statusCode: 400 });
      res.status(201).json({ ok: true, data: await record({ ...parsed.data, companyId, branchId, userId }) });
    } catch (error) { next(error); }
  });
  }
  router.post('/transfers', authorize('usuarios.editar'), async (req, res, next) => {
    try {
      const { companyId, branchId, userId } = req.tenant!;
      if (!companyId || !branchId || !userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Missing tenant', friendlyMessage: 'La sesión requiere empresa y sucursal.', statusCode: 401 });
      const parsed = schema.extend({ destinationWarehouseId: z.string().regex(/^[a-f\d]{24}$/i) }).safeParse(req.body);
      if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid transfer', friendlyMessage: 'Revisa origen, destino, producto, cantidad y referencia.', statusCode: 400 });
      res.status(201).json({ ok: true, data: await transferStock({ ...parsed.data, companyId, branchId, userId }) });
    } catch (error) { next(error); }
  });
  return router;
}
