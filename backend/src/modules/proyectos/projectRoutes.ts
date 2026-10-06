import type { Request } from 'express';
import { Router } from 'express';
import { AppError } from '../../errors/AppError.js';
import {parseProjectPage,parseProjectCustomerPage,pageProjects,pageProjectCustomers,saveAuditedProject} from './projectAdministration.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { listProjects } from './projectService.js';
function scope(req: Request): { companyId: string; branchId: string; userId: string } { const t = req.tenant; if (!t?.companyId || !t.branchId || !t.userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context missing', friendlyMessage: 'La sesion no tiene empresa y sucursal activas.', statusCode: 401 }); return { companyId: t.companyId, branchId: t.branchId, userId: t.userId }; }
export function createProjectRoutes(): Router {
  const router = Router();
  router.get('/customer-options',authenticate,tenant,authorize('proyectos.crear'),async(req,res,next)=>{try{res.json({ok:true,data:await pageProjectCustomers(scope(req),parseProjectCustomerPage(req.query))});}catch(e){next(e);}});
  router.get('/', authenticate, tenant, authorize('proyectos.ver'), async (req, res, next) => { try { const s = scope(req); res.json({ ok: true, data: await listProjects(s.companyId, s.branchId) }); } catch (error) { next(error); } });
  router.get('/page',authenticate,tenant,authorize('proyectos.ver'),async(req,res,next)=>{try{res.json({ok:true,data:await pageProjects(scope(req),parseProjectPage(req.query))});}catch(e){next(e);}});
  router.post('/',authenticate,tenant,authorize('proyectos.crear'),async(req,res,next)=>{try{res.status(201).json({ok:true,data:await saveAuditedProject({...scope(req),ipAddress:req.ip},req.body)});}catch(e){next(e);}});
  router.patch('/:id',authenticate,tenant,authorize('proyectos.editar'),async(req,res,next)=>{try{res.json({ok:true,data:await saveAuditedProject({...scope(req),ipAddress:req.ip},req.body,String(req.params.id))});}catch(e){next(e);}});
  return router;
}
