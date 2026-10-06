import {z} from 'zod';
import { Router, type Request } from 'express';

import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createAuditedDepartment, listDepartments, pageDepartments, parseDepartmentQuery, updateAuditedDepartment } from './departmentService.js';

function getTenantScope(req: Request): { companyId: string; branchId: string } {
  const companyId = req.tenant?.companyId?.trim();
  const branchId = req.tenant?.branchId?.trim();
  if (!companyId || !branchId) {
    throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context unavailable', friendlyMessage: 'La sesi\u00f3n no tiene una empresa y sucursal v\u00e1lidas.', statusCode: 401 });
  }
  return { companyId, branchId };
}

export function createDepartmentRoutes(): Router {
  const router = Router();
  router.get('/page',authenticate,tenant,authorize('usuarios.ver'),async(req,res,next)=>{try{const s=getTenantScope(req);res.json({ok:true,data:await pageDepartments(s.companyId,s.branchId,parseDepartmentQuery(req.query))});}catch(error){next(error);}});
  router.get('/', authenticate, tenant, authorize('usuarios.ver'), async (req, res, next) => {
    try {
      const { companyId, branchId } = getTenantScope(req);
      res.json({ ok: true, data: await listDepartments(companyId, branchId) });
    } catch (error) {
      next(error);
    }
  });
  router.post('/', authenticate, tenant, authorize('usuarios.editar'), async (req, res, next) => {
    try {
      const { companyId, branchId } = getTenantScope(req);
      const parsed = z.object({name:z.string().trim().min(1).max(120),code:z.string().trim().min(1).max(32)}).strict().safeParse(req.body);
      if (!parsed.success) {
        throw new AppError({ code: 'VALIDATION_ERROR', message: 'Invalid department input', friendlyMessage: 'Indica el nombre y c\u00f3digo del departamento.', statusCode: 400 });
      }
      const userId = req.tenant?.userId;
      if (!userId) throw new AppError({code:'UNAUTHORIZED',message:'Missing audit actor',friendlyMessage:'La sesión no tiene un usuario activo.',statusCode:401});
      const created = await createAuditedDepartment({ companyId, branchId, ...parsed.data },{userId,ipAddress:req.ip});
      res.status(201).json({ ok: true, data: created });
    } catch (error) {
      next(error);
    }
  });
  router.patch('/:id',authenticate,tenant,authorize('usuarios.editar'),async(req,res,next)=>{try{
    const s=getTenantScope(req),userId=req.tenant?.userId;if(!userId)throw new AppError({code:'UNAUTHORIZED',message:'Missing department actor',friendlyMessage:'La sesión no tiene usuario activo.',statusCode:401});
    const fields=z.object({name:z.string().trim().min(1).max(120),code:z.string().trim().min(1).max(32),status:z.enum(['ACTIVE','INACTIVE'])}).strict();
    const parsed=fields.extend({expected:fields}).strict().safeParse(req.body),id=String(req.params.id);
    if(!parsed.success||!id.trim()||id.length>100)throw new AppError({code:'VALIDATION_ERROR',message:'Invalid department edit',friendlyMessage:'Revisa el nombre, código, estado y valores originales.',statusCode:400});
    res.json({ok:true,data:await updateAuditedDepartment({...s,id,...parsed.data},{userId,ipAddress:req.ip})});
  }catch(error){next(error);}});
  return router;
}
