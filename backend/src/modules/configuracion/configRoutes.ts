import { Router, type Request } from 'express';

import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { getModuleConfig, listModuleConfigs, updateInventoryConfig } from './configService.js';

function getCompanyId(req: Request): string {
  const companyId = req.tenant?.companyId?.trim();
  if (!companyId) {
    throw new AppError({
      code: 'UNAUTHORIZED',
      message: 'Tenant context unavailable',
      friendlyMessage: 'La sesión no tiene un contexto de empresa válido.',
      statusCode: 401
    });
  }
  return companyId;
}

export function createConfigRoutes(): Router {
  const router = Router();

  router.get('/', authenticate, tenant, authorize('configuracion.ver'), async (req, res, next) => {
    try { res.json({ok:true,data:await listModuleConfigs(getCompanyId(req))}); } catch(error) { next(error); }
  });
  router.get('/:module', authenticate, tenant, authorize('configuracion.ver'), async (req, res, next) => {
    try { res.json({ok:true,data:await getModuleConfig(getCompanyId(req),String(req.params.module??''))}); } catch(error) { next(error); }
  });
  router.put('/inventario',authenticate,tenant,authorize('configuracion.ver'),authorize('usuarios.editar'),async(req,res,next)=>{try{const companyId=getCompanyId(req),branchId=req.tenant?.branchId,userId=req.tenant?.userId;if(!branchId||!userId)throw new AppError({code:'UNAUTHORIZED',message:'Missing audit scope',friendlyMessage:'La sesión requiere empresa, sucursal y usuario.',statusCode:401});res.json({ok:true,data:await updateInventoryConfig({companyId,branchId,userId},req.body)});}catch(e){next(e);}});
  return router;
}
