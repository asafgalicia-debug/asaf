import {readCurrentCompany,saveOrganization} from './organizationAdministration.js';
import { Router, type Request } from 'express';

import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { listBranches } from './branchService.js';
import { listCompanies } from './companyService.js';

function getCompanyId(req: Request): string {
  const companyId = req.tenant?.companyId?.trim();
  if (!companyId) {
    throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context unavailable', friendlyMessage: 'La sesi\u00f3n no tiene una empresa v\u00e1lida.', statusCode: 401 });
  }
  return companyId;
}

export function createCompanyRoutes(): Router {
  const router = Router();
  router.get('/current',authenticate,tenant,authorize('usuarios.ver'),async(req,res,next)=>{try{res.json({ok:true,data:await readCurrentCompany(getCompanyId(req))});}catch(error){next(error);}});
  router.patch('/current',authenticate,tenant,authorize('usuarios.editar'),async(req,res,next)=>{try{if(!req.user?.id||!req.tenant?.branchId)throw new AppError({code:'UNAUTHORIZED',message:'Missing actor',friendlyMessage:'Inicia sesión de nuevo.',statusCode:401});res.json({ok:true,data:await saveOrganization({companyId:getCompanyId(req),branchId:req.tenant.branchId,userId:req.user.id,ipAddress:req.ip},'company',req.body)});}catch(error){next(error);}});

  router.get('/', authenticate, tenant, authorize('usuarios.ver'), async (req, res, next) => {
    try {
      const companies = await listCompanies(getCompanyId(req));
      const data = await Promise.all(companies.map(async (company) => ({
        id: company.id,
        name: company.name,
        taxId: company.taxId,
        status: company.status,
        branches: (await listBranches(company.id)).map(({ id, name }) => ({ id, name }))
      })));
      res.json({ ok: true, data });
    } catch (error) {
      next(error);
    }
  });
  return router;
}
