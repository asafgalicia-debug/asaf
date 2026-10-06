import type { Request } from 'express';
import { Router } from 'express';
import { AppError } from '../../errors/AppError.js';
import {administerProduction,pageProductionOrders,parseProductionPage,pageProductionProducts,parseProductionProductPage} from './productionAdministration.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { getProductionSummary, listProductionOrders } from './productionService.js';
function scope(req: Request): { companyId: string; branchId: string; userId: string } { const t = req.tenant; if (!t?.companyId || !t.branchId || !t.userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context missing', friendlyMessage: 'La sesion no tiene empresa y sucursal activas.', statusCode: 401 }); return { companyId: t.companyId, branchId: t.branchId, userId: t.userId }; }
export function createProductionRoutes(): Router {
  const router = Router();
  router.get('/product-options',authenticate,tenant,authorize('usuarios.editar'),async(req,res,next)=>{try{res.json({ok:true,data:await pageProductionProducts(scope(req),parseProductionProductPage(req.query))});}catch(e){next(e);}});
  router.get('/summary', authenticate, tenant, authorize('produccion.ver'), async (req, res, next) => { try { const s = scope(req); res.json({ ok: true, data: await getProductionSummary(s.companyId, s.branchId) }); } catch (error) { next(error); } });
  router.get('/orders', authenticate, tenant, authorize('produccion.ver'), async (req, res, next) => { try { const s = scope(req); res.json({ ok: true, data: await listProductionOrders(s.companyId, s.branchId) }); } catch (error) { next(error); } });
  router.get('/orders/page',authenticate,tenant,authorize('produccion.ver'),async(req,res,next)=>{try{res.json({ok:true,data:await pageProductionOrders(scope(req),parseProductionPage(req.query))});}catch(e){next(e);}});
  router.post('/orders',authenticate,tenant,authorize('usuarios.editar'),async(req,res,next)=>{try{res.status(201).json({ok:true,data:await administerProduction({...scope(req),ipAddress:req.ip},'create',req.body)});}catch(e){next(e);}});
  router.patch('/orders/:id/state',authenticate,tenant,authorize('usuarios.editar'),async(req,res,next)=>{try{res.json({ok:true,data:await administerProduction({...scope(req),ipAddress:req.ip},'state',req.body,String(req.params.id))});}catch(e){next(e);}});
  router.post('/orders/:id/complete',authenticate,tenant,authorize('usuarios.editar'),async(req,res,next)=>{try{res.json({ok:true,data:await administerProduction({...scope(req),ipAddress:req.ip},'complete',req.body,String(req.params.id))});}catch(e){next(e);}});
  return router;
}
