import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { tenant } from '../../middleware/tenant.js';
import { createShipment, listShipments } from './shipmentService.js';

export function createShipmentRoutes(): Router {
  const router = Router();

  router.get('/', authenticate, tenant, authorize('logistica.ver'), (req, res) => {
    const companyId = req.user?.companyId ?? 'company-demo-01';

    res.json({
      ok: true,
      data: listShipments(companyId)
    });
  });

  router.post('/', authenticate, tenant, authorize('logistica.crear'), (req, res, next) => {
    try {
      const created = createShipment({
        companyId: req.user?.companyId ?? 'company-demo-01',
        saleId: req.body?.saleId,
        destination: req.body?.destination,
        status: req.body?.status ?? 'PENDING',
        scheduledDate: req.body?.scheduledDate
      });

      res.status(201).json({ ok: true, data: created });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
