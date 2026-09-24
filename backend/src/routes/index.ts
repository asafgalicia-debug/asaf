import { Router } from 'express';
import { loadModuleManifests } from '../core/moduleRegistry.js';

import { createAuthRoutes } from '../modules/auth/authRoutes.js';
import { createAuditRoutes } from '../modules/auditoria/auditRoutes.js';
import { createConfigRoutes } from '../modules/configuracion/configRoutes.js';
import { createCompanyRoutes } from '../modules/empresas/companyRoutes.js';
import { createDepartmentRoutes } from '../modules/empresas/departmentRoutes.js';
import { createCustomerRoutes } from '../modules/clientes/customerRoutes.js';
import { createAnalyticsRoutes } from '../modules/analytics/analyticsRoutes.js';
import { createAutomationRoutes } from '../modules/automation/automationRoutes.js';
import { createBusinessIntelligenceRoutes } from '../modules/businessIntelligence/businessIntelligenceRoutes.js';
import { createCustomerSuccessRoutes } from '../modules/customerSuccess/customerSuccessRoutes.js';
import { createBusinessContinuityRoutes } from '../modules/businessContinuity/businessContinuityRoutes.js';
import { createComplianceRoutes } from '../modules/compliance/complianceRoutes.js';
import { createCustomerSupportRoutes } from '../modules/customerSupport/customerSupportRoutes.js';
import { createDashboardRoutes } from '../modules/dashboard/dashboardRoutes.js';
import { createSupplyChainRoutes } from '../modules/supplyChain/supplyChainRoutes.js';
import { createDeploymentRoutes } from '../modules/deployment/deploymentRoutes.js';
import { createDisasterRecoveryRoutes } from '../modules/disasterRecovery/disasterRecoveryRoutes.js';
import { createKnowledgeBaseRoutes } from '../modules/knowledgeBase/knowledgeBaseRoutes.js';
import { createFleetManagementRoutes } from '../modules/fleetManagement/fleetManagementRoutes.js';
import { createContractManagementRoutes } from '../modules/contractManagement/contractManagementRoutes.js';
import { createBudgetPlanningRoutes } from '../modules/budgetPlanning/budgetPlanningRoutes.js';
import { createMaintenanceRoutes } from '../modules/mantenimiento/maintenanceRoutes.js';
import { createObservabilityRoutes } from '../modules/observability/observabilityRoutes.js';
import { createQualityRoutes } from '../modules/calidad/qualityRoutes.js';
import { createAssetManagementRoutes } from '../modules/assetManagement/assetManagementRoutes.js';
import { createMaintenancePlanningRoutes } from '../modules/maintenancePlanning/maintenancePlanningRoutes.js';
import { createOrderFulfillmentRoutes } from '../modules/orderFulfillment/orderFulfillmentRoutes.js';
import { createProcurementRoutes } from '../modules/procurement/procurementRoutes.js';
import { createReturnsManagementRoutes } from '../modules/returnsManagement/returnsManagementRoutes.js';
import { createSustainabilityRoutes } from '../modules/sustainability/sustainabilityRoutes.js';
import { createTraceabilityRoutes } from '../modules/traceability/traceabilityRoutes.js';
import { createWarehouseOptimizationRoutes } from '../modules/warehouseOptimization/warehouseOptimizationRoutes.js';
import { createWarrantyManagementRoutes } from '../modules/warrantyManagement/warrantyManagementRoutes.js';
import { createResourcePlanningRoutes } from '../modules/resourcePlanning/resourcePlanningRoutes.js';
import { createRiskManagementRoutes } from '../modules/riskManagement/riskManagementRoutes.js';
import { createServiceDeskRoutes } from '../modules/serviceDesk/serviceDeskRoutes.js';
import { createVendorManagementRoutes } from '../modules/vendorManagement/vendorManagementRoutes.js';
import { createOpportunityRoutes } from '../modules/crm/opportunityRoutes.js';
import { createPartnerPortalRoutes } from '../modules/partnerPortal/partnerPortalRoutes.js';
import { createProductionRoutes } from '../modules/produccion/productionRoutes.js';
import { createPurchaseOrderRoutes } from '../modules/compras/purchaseOrderRoutes.js';
import { createReleaseRoutes } from '../modules/release/releaseRoutes.js';
import { createNotificationRoutes } from '../modules/notificaciones/notificationRoutes.js';
import { createShipmentRoutes } from '../modules/logistica/shipmentRoutes.js';
import { createBankAccountRoutes } from '../modules/finanzas/bankAccountRoutes.js';
import { createCashMovementRoutes } from '../modules/finanzas/cashMovementRoutes.js';
import { createExpenseRoutes } from '../modules/finanzas/expenseRoutes.js';
import { createIncomeRoutes } from '../modules/finanzas/incomeRoutes.js';
import { createInvoiceRoutes } from '../modules/facturacion/invoiceRoutes.js';
import { createEmployeeRoutes } from '../modules/recursos-humanos/employeeRoutes.js';
import { createIntegrationRoutes } from '../modules/integraciones/integrationRoutes.js';
import { createAIRoutes } from '../modules/inteligencia-artificial/aiRoutes.js';
import { createProjectRoutes } from '../modules/proyectos/projectRoutes.js';
import { createReportRoutes } from '../modules/reportes/reportRoutes.js';
import { createTransferRoutes } from '../modules/inventario/transferRoutes.js';
import { createWarehouseRoutes } from '../modules/inventario/warehouseRoutes.js';
import { createCategoryRoutes } from '../modules/productos/categoryRoutes.js';
import { createProductRoutes } from '../modules/productos/productRoutes.js';
import { createRoleRoutes } from '../modules/roles/roleRoutes.js';
import { createSaleRoutes } from '../modules/ventas/saleRoutes.js';
import { createSupplierRoutes } from '../modules/proveedores/supplierRoutes.js';
import { createUserRoutes } from '../modules/usuarios/userRoutes.js';

export function createAppRouter(): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.json({
      ok: true,
      data: {
        status: 'ok',
        api: 'v1',
        message: 'API base del ERP inicializada.'
      }
    });
  });

  router.get('/modules', (_req, res) => {
    res.json({
      ok: true,
      data: {
        modules: loadModuleManifests().map(({ id, name, version, state, apiPrefix, permissions, enabledByDefault }) => ({
          id, name, version, state, apiPrefix, permissions, enabled: enabledByDefault
        }))
      }
    });
  });

  router.use('/auth', createAuthRoutes());
  router.use('/users', createUserRoutes());
  router.use('/roles', createRoleRoutes());
  router.use('/companies', createCompanyRoutes());
  router.use('/departments', createDepartmentRoutes());
  router.use('/customers', createCustomerRoutes());
  router.use('/crm/opportunities', createOpportunityRoutes());
  router.use('/shipments', createShipmentRoutes());
  router.use('/notifications', createNotificationRoutes());
  router.use('/suppliers', createSupplierRoutes());
  router.use('/categories', createCategoryRoutes());
  router.use('/products', createProductRoutes());
  router.use('/warehouses', createWarehouseRoutes());
  router.use('/transfers', createTransferRoutes());
  router.use('/employees', createEmployeeRoutes());
  router.use('/projects', createProjectRoutes());
  router.use('/audit', createAuditRoutes());
  router.use('/dashboard', createDashboardRoutes());
  router.use('/deployment', createDeploymentRoutes());
  router.use('/release', createReleaseRoutes());
  router.use('/observability', createObservabilityRoutes());
  router.use('/automation', createAutomationRoutes());
  router.use('/analytics', createAnalyticsRoutes());
  router.use('/business-intelligence', createBusinessIntelligenceRoutes());
  router.use('/partners', createPartnerPortalRoutes());
  router.use('/customer-success', createCustomerSuccessRoutes());
  router.use('/customer-support', createCustomerSupportRoutes());
  router.use('/service-desk', createServiceDeskRoutes());
  router.use('/knowledge-base', createKnowledgeBaseRoutes());
  router.use('/compliance', createComplianceRoutes());
  router.use('/risk-management', createRiskManagementRoutes());
  router.use('/disaster-recovery', createDisasterRecoveryRoutes());
  router.use('/business-continuity', createBusinessContinuityRoutes());
  router.use('/vendor-management', createVendorManagementRoutes());
  router.use('/supply-chain', createSupplyChainRoutes());
  router.use('/traceability', createTraceabilityRoutes());
  router.use('/sustainability', createSustainabilityRoutes());
  router.use('/returns-management', createReturnsManagementRoutes());
  router.use('/asset-management', createAssetManagementRoutes());
  router.use('/warehouse-optimization', createWarehouseOptimizationRoutes());
  router.use('/order-fulfillment', createOrderFulfillmentRoutes());
  router.use('/procurement', createProcurementRoutes());
  router.use('/maintenance-planning', createMaintenancePlanningRoutes());
  router.use('/warranty-management', createWarrantyManagementRoutes());
  router.use('/maintenance', createMaintenanceRoutes());
  router.use('/quality', createQualityRoutes());
  router.use('/fleet-management', createFleetManagementRoutes());
  router.use('/resource-planning', createResourcePlanningRoutes());
  router.use('/contract-management', createContractManagementRoutes());
  router.use('/budget-planning', createBudgetPlanningRoutes());
  router.use('/config', createConfigRoutes());
  router.use('/reports', createReportRoutes());
  router.use('/integrations', createIntegrationRoutes());
  router.use('/ai', createAIRoutes());
  router.use('/production', createProductionRoutes());
  router.use('/sales', createSaleRoutes());
  router.use('/purchase-orders', createPurchaseOrderRoutes());
  router.use('/bank-accounts', createBankAccountRoutes());
  router.use('/cash-movements', createCashMovementRoutes());
  router.use('/incomes', createIncomeRoutes());
  router.use('/expenses', createExpenseRoutes());
  router.use('/invoices', createInvoiceRoutes());

  return router;
}
