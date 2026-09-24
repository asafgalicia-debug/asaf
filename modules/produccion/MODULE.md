# Módulo: Producción

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/produccion/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `produccion` |
| Estado | `planeado` |
| Fase | FASE 18 — Producción |
| API prevista | `/api/v1/production` |
| Prefijo de permiso | `produccion` |

## Propósito
Órdenes de producción, listas de materiales y seguimiento de procesos para empresas manufactureras.

## Entidades principales
- `OrdenProduccion` (estado, cantidades, fechas).
- `ListaMateriales` (insumos por producto terminado).
- `Operacion` (etapa del proceso).

## Permisos previstos
`produccion.ver`, `produccion.crear`, `produccion.editar`, `produccion.aprobar`, `produccion.exportar`.

## Dependencias / notas
- Consumo/producción impacta `inventario` (entrada de terminados, salida de insumos): integración a documentar en FASE 18.
- Depende de: `productos`, `inventario`.
- Estados solo desde `shared/constants`.
