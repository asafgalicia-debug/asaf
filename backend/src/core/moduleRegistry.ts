export type ModuleManifest = {
  id: string;
  name: string;
  version: string;
  state: 'planeado' | 'en-construcci\u00f3n' | 'estable' | 'deprecado';
  apiPrefix: string;
  permissions: string[];
  enabledByDefault?: boolean;
};

const moduleCatalog: ModuleManifest[] = [
  { id: 'auth', name: 'Autenticaci\u00f3n', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/auth', permissions: ['auth.login', 'auth.profile'], enabledByDefault: true },
  { id: 'usuarios', name: 'Usuarios', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/users', permissions: ['usuarios.ver', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar'], enabledByDefault: true },
  { id: 'roles', name: 'Roles y permisos', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/roles', permissions: ['roles.ver', 'roles.crear', 'roles.editar'], enabledByDefault: true },
  { id: 'auditoria', name: 'Auditor\u00eda', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/audit', permissions: ['auditoria.ver'], enabledByDefault: true },
  { id: 'empresas', name: 'Empresas y sucursales', version: '0.1.0', state: 'estable', apiPrefix: '/companies', permissions: ['configuracion.ver'], enabledByDefault: true },
  { id: 'departamentos', name: 'Departamentos', version: '0.1.0', state: 'estable', apiPrefix: '/departments', permissions: ['configuracion.ver'], enabledByDefault: true },
  { id: 'clientes', name: 'Clientes', version: '0.1.0', state: 'estable', apiPrefix: '/customers', permissions: ['clientes.ver', 'clientes.crear', 'clientes.editar'], enabledByDefault: true },
  { id: 'crm', name: 'CRM y oportunidades', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/crm/opportunities', permissions: ['crm.ver', 'crm.crear', 'crm.editar'], enabledByDefault: true },
  { id: 'proveedores', name: 'Proveedores', version: '0.1.0', state: 'estable', apiPrefix: '/suppliers', permissions: ['proveedores.ver', 'proveedores.crear', 'proveedores.editar'], enabledByDefault: true },
  { id: 'productos', name: 'Productos y categor\u00edas', version: '0.1.0', state: 'estable', apiPrefix: '/products', permissions: ['productos.ver', 'productos.crear', 'productos.editar'], enabledByDefault: true },
  { id: 'inventario', name: 'Inventario y almacenes', version: '0.1.0', state: 'estable', apiPrefix: '/warehouses', permissions: ['inventario.ver', 'inventario.editar'], enabledByDefault: true },
  { id: 'ventas', name: 'Ventas', version: '0.1.0', state: 'estable', apiPrefix: '/sales', permissions: ['ventas.ver', 'ventas.crear'], enabledByDefault: true },
  { id: 'compras', name: 'Compras', version: '0.1.0', state: 'estable', apiPrefix: '/purchase-orders', permissions: ['compras.ver', 'compras.crear'], enabledByDefault: true },
  { id: 'finanzas', name: 'Finanzas', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/bank-accounts', permissions: ['finanzas.ver', 'finanzas.editar'], enabledByDefault: true },
  { id: 'facturacion', name: 'Facturaci\u00f3n', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/invoices', permissions: ['facturacion.ver', 'facturacion.crear'], enabledByDefault: true },
  { id: 'recursos-humanos', name: 'Recursos humanos', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/employees', permissions: ['rrhh.ver', 'rrhh.editar'], enabledByDefault: true },
  { id: 'produccion', name: 'Producci\u00f3n', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/production', permissions: ['produccion.ver'], enabledByDefault: true },
  { id: 'proyectos', name: 'Proyectos', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/projects', permissions: ['proyectos.ver', 'proyectos.crear'], enabledByDefault: true },
  { id: 'reportes', name: 'Reportes', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/reports', permissions: ['reportes.ver'], enabledByDefault: true },
  { id: 'dashboard', name: 'Dashboard', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/dashboard', permissions: ['dashboard.ver'], enabledByDefault: true },
  { id: 'notificaciones', name: 'Notificaciones', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/notifications', permissions: ['notificaciones.ver'], enabledByDefault: true },
  { id: 'logistica', name: 'Log\u00edstica', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/shipments', permissions: ['logistica.ver', 'logistica.crear', 'logistica.editar'], enabledByDefault: true },
  { id: 'integraciones', name: 'Integraciones', version: '0.1.0', state: 'planeado', apiPrefix: '/integrations', permissions: ['integraciones.ver', 'integraciones.configurar'], enabledByDefault: true },
  { id: 'inteligencia-artificial', name: 'Inteligencia artificial', version: '0.1.0', state: 'planeado', apiPrefix: '/ai', permissions: ['ia.consultar', 'ia.configurar'], enabledByDefault: true },
  { id: 'configuracion', name: 'Configuraci\u00f3n', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/config', permissions: ['configuracion.ver'], enabledByDefault: true },
  { id: 'mantenimiento', name: 'Mantenimiento', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/maintenance', permissions: ['mantenimiento.ver'], enabledByDefault: true },
  { id: 'calidad', name: 'Calidad', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/quality', permissions: ['calidad.ver'], enabledByDefault: true },
  { id: 'activos', name: 'Activos', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/asset-management', permissions: ['activos.ver'], enabledByDefault: true },
  { id: 'soporte', name: 'Mesa de ayuda', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/service-desk', permissions: ['soporte.ver'], enabledByDefault: true },
  { id: 'riesgo', name: 'Riesgos', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/risk-management', permissions: ['riesgo.ver'], enabledByDefault: true },
  { id: 'cumplimiento', name: 'Cumplimiento', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/compliance', permissions: ['cumplimiento.ver'], enabledByDefault: true },
  { id: 'observabilidad', name: 'Observabilidad', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/observability', permissions: ['observabilidad.ver'], enabledByDefault: true },
  { id: 'despliegue', name: 'Despliegue', version: '0.1.0', state: 'en-construcci\u00f3n', apiPrefix: '/deployment', permissions: ['despliegue.ver'], enabledByDefault: true }
];

export function loadModuleManifests(): ModuleManifest[] {
  return moduleCatalog.map((module) => ({ ...module, permissions: [...module.permissions] }));
}
