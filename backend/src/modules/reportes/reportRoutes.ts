import {z} from 'zod';
import {previewReport} from './reportPreview.js';
import { Router, type Request } from 'express';

import { logAuditEvent } from '../../audit/auditLogger.js';
import { AppError } from '../../errors/AppError.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createReport, listReports } from './reportService.js';
import type { ReportPeriod, ReportType } from './models/Report.js';

const reportTypes: ReportType[] = ['sales', 'cash-flow', 'inventory', 'financial'];
const reportPeriods: ReportPeriod[] = ['day', 'week', 'month', 'quarter', 'year'];

const reportSchema=z.object({name:z.string().trim().min(1).max(120),type:z.enum(['sales','cash-flow','inventory','financial']),period:z.enum(['day','week','month','quarter','year']),filters:z.object({}).strict().optional()}).strict();
function getTenantContext(req: Request): { companyId: string; branchId: string; userId: string } {
  const context = req.tenant;
  if (!context?.companyId || !context.branchId || !context.userId) {
    throw new AppError({ code: 'UNAUTHORIZED', message: 'Tenant context unavailable', friendlyMessage: 'La sesiÃ³n no tiene un contexto de empresa y sucursal vÃ¡lido.', statusCode: 401 });
  }
  return { companyId: context.companyId, branchId: context.branchId, userId: context.userId };
}

export function createReportRoutes(): Router {
  const router = Router();
  router.get('/preview', authenticate, tenant, authorize('reportes.ver'), async (req,res,next)=>{
    try {const context=getTenantContext(req);const {type,period}=req.query;
      if(Object.keys(req.query).some(key=>!['type','period'].includes(key)) || typeof type!=='string' || !['sales','cash-flow'].includes(type) || typeof period!=='string' || !reportPeriods.includes(period as ReportPeriod))throw new AppError({code:'VALIDATION_ERROR',message:'Invalid report query',friendlyMessage:'Selecciona tipo y periodo válidos.',statusCode:400});
      res.json({ok:true,data:await previewReport(context.companyId,context.branchId,type as 'sales'|'cash-flow',period as ReportPeriod)});
    }catch(e){next(e);}
  });
  router.get('/', authenticate, tenant, authorize('reportes.ver'), async (req, res, next) => {
    try {
      const context = getTenantContext(req);
      res.json({ ok: true, data: await listReports(context.companyId, context.branchId) });
    } catch (error) { next(error); }
  });
  router.post('/', authenticate, tenant, authorize('reportes.ver'), async (req, res, next) => {
    try {
      const context = getTenantContext(req);
      const parsed=reportSchema.safeParse(req.body);
      if(!parsed.success)throw new AppError({code:'VALIDATION_ERROR',message:'Invalid report request',friendlyMessage:'Revisa nombre, tipo y periodo. No se admiten filtros adicionales.',statusCode:400});
      const {name,type,period,filters}=parsed.data;
      const created = await createReport({ ...context, name, type, period, filters });
      await logAuditEvent({ ...context, action: 'CREATE', module: 'reportes', entityId: String(created.id), details: { type, period } });
      res.status(201).json({ ok: true, data: created });
    } catch (error) { next(error); }
  });
  return router;
}
