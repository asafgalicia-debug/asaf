export const MODULE_ACTIONS = [
  'ver',
  'crear',
  'editar',
  'eliminar',
  'autorizar',
  'exportar',
  'aprobar',
  'configurar'
] as const;

export type ModuleAction = (typeof MODULE_ACTIONS)[number];

export const MODULE_STATES = [
  'planeado',
  'en-construcción',
  'estable',
  'deprecado'
] as const;

export const ENTITY_STATES = [
  'BORRADOR',
  'PENDIENTE',
  'APROBADO',
  'RECHAZADO',
  'CANCELADO',
  'COMPLETADO'
] as const;

export const DEFAULT_ROLES = [
  'ADMIN',
  'GERENTE',
  'VENTAS',
  'COMPRAS',
  'ALMACÉN',
  'CONTABILIDAD',
  'RRHH',
  'PRODUCCIÓN',
  'AUDITOR',
  'CONSULTA'
] as const;
