import {pageCompanyBranches,saveOrganization} from './organizationAdministration.js';
import { Router, type Request } from 'express';

import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createBranch, listBranches } from './branchService.js';

function getCompanyId(req: Request): string {
  const companyId = req.tenant?.companyId?.trim();
  if (!companyId) {
    throw new AppError({
      code: 'UNAUTHORIZED',
      message: 'Tenant context unavailable',
      friendlyMessage: 'La sesiÃ³n no tiene una empresa vÃ¡lida.',
      statusCode: 401
    });
  }
  return companyId;
}

export function createBranchRoutes(): Router {
  const router = Router();
  router.get('/page',authenticate,tenant,authorize('usuarios.ver'),async(req,res,next)=>{try{res.json({ok:true,data:await pageCompanyBranches(getCompanyId(req),req.query)});}catch(error){next(error);}});
  router.patch('/:id',authenticate,tenant,authorize('usuarios.editar'),async(req,res,next)=>{try{if(!req.user?.id||!req.tenant?.branchId)throw new AppError({code:'UNAUTHORIZED',message:'Missing actor',friendlyMessage:'Inicia sesión de nuevo.',statusCode:401});res.json({ok:true,data:await saveOrganization({companyId:getCompanyId(req),branchId:req.tenant.branchId,userId:req.user.id,ipAddress:req.ip},'branch',req.body,String(req.params.id))});}catch(error){next(error);}});


  router.get('/', authenticate, tenant, authorize('usuarios.ver'), async (req, res, next) => {
    try {
      res.json({ ok: true, data: await listBranches(getCompanyId(req)) });
    } catch (error) {
      next(error);
    }
  });

  router.post('/', authenticate, tenant, authorize('usuarios.editar'), async (req, res, next) => {
    try {
      const { name, code, city } = req.body ?? {};
      if (typeof name !== 'string' || typeof code !== 'string' || typeof city !== 'string') {
        throw new AppError({
          code: 'VALIDATION_ERROR',
          message: 'Invalid branch input',
          friendlyMessage: 'Indica el nombre, cÃ³digo y ciudad de la sucursal.',
          statusCode: 400
        });
      }
      if(!req.user?.id||!req.tenant?.branchId)throw new AppError({code:'UNAUTHORIZED',message:'Missing actor',friendlyMessage:'Inicia sesión de nuevo.',statusCode:401});
      const branch = await saveOrganization({companyId:getCompanyId(req),branchId:req.tenant.branchId,userId:req.user.id,ipAddress:req.ip},'branch',req.body);
      res.status(201).json({ ok: true, data: branch });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
