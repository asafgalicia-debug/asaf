import {pageEmployeeOptions,parseEmployeeOptionQuery} from './employeeOptions.js';
import {parseCatalogQuery} from '../../core/catalogPagination.js';
import type { Request } from 'express';
import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { updateAuditedEmployee, createAuditedEmployee, listEmployees, pageEmployees } from './employeeService.js';
const schema = z.object({ departmentId: z.string().trim().min(1).max(100), userId: z.string().regex(/^[a-f0-9]{24}$/i), fullName: z.string().trim().min(2).max(120), position: z.string().trim().min(2).max(100) }).strict();
function scope(req: Request): { companyId: string; branchId: string; userId: string } { const t = req.tenant; if (!t?.companyId || !t.branchId || !t.userId) throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context missing', friendlyMessage: 'La sesion no tiene empresa y sucursal activas.', statusCode: 401 }); return { companyId: t.companyId, branchId: t.branchId, userId: t.userId }; }
export function createEmployeeRoutes(): Router {
  const router = Router();
  for(const kind of ['users','departments'] as const)router.get('/options/'+kind,authenticate,tenant,authorize('rrhh.crear'),async(req,res,next)=>{try{const s=scope(req);res.json({ok:true,data:await pageEmployeeOptions(s.companyId,s.branchId,kind,parseEmployeeOptionQuery(req.query,kind))});}catch(error){next(error);}});
  router.get('/page',authenticate,tenant,authorize('rrhh.ver'),async(req,res,next)=>{try{const s=scope(req);res.json({ok:true,data:await pageEmployees(s.companyId,s.branchId,parseCatalogQuery(req.query))});}catch(error){next(error);}});
  router.get('/', authenticate, tenant, authorize('rrhh.ver'), async (req, res, next) => { try { const s = scope(req); res.json({ ok: true, data: await listEmployees(s.companyId, s.branchId) }); } catch (error) { next(error); } });
  router.post('/', authenticate, tenant, authorize('rrhh.crear'), async (req, res, next) => { try { const s = scope(req); const parsed = schema.safeParse(req.body); if (!parsed.success) throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid employee data', friendlyMessage: 'Revisa departamento, usuario, nombre y puesto.', statusCode: 400 }); const row = await createAuditedEmployee({ ...parsed.data, companyId: s.companyId, branchId: s.branchId },{userId:s.userId,ipAddress:req.ip}); res.status(201).json({ ok: true, data: row }); } catch (error) { next(error); } });
  router.patch('/:id',authenticate,tenant,authorize('rrhh.editar'),async(req,res,next)=>{try{
    const s=scope(req);const fields=z.object({fullName:z.string().trim().min(2).max(120),position:z.string().trim().min(2).max(100)}).strict();
    const parsed=fields.extend({expected:fields}).strict().safeParse(req.body);
    if(!/^[a-f0-9]{24}$/i.test(String(req.params.id))||!parsed.success)throw new AppError({code:'VALIDATION_ERROR',message:'Invalid employee update',friendlyMessage:'Revisa el nombre, puesto y registro original.',statusCode:400});
    res.json({ok:true,data:await updateAuditedEmployee({...s,id:String(req.params.id),...parsed.data},{userId:s.userId,ipAddress:req.ip})});
  }catch(error){next(error);}});
  return router;
}