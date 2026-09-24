# Módulo: Dashboard

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/dashboard/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `dashboard` |
| Estado | `planeado` |
| Fase | FASE 10 — Dashboard |
| API prevista | `/api/v1/dashboard` |
| Prefijo de permiso | `dashboard` |

## Propósito
KPIs, alertas, actividad reciente e indicadores de negocio **adaptados al rol** y a los módulos activos de la empresa (§17).

## Entidades principales
- Consultas agregadas sobre los módulos activos (no propias).
- Configuración de widgets por rol (futuro).

## Permisos previstos
`dashboard.ver` (los indicadores que muestra dependen también de los permisos del usuario sobre cada módulo).

## Dependencias / notas
- Contexto multiempresa: todo agregado filtra por `companyId` (y sucursal si aplica).
- Un vendedor no recibe el mismo dashboard que un administrador.
- Requiere datos de módulos activos: ventas, compras, inventario, finanzas.
