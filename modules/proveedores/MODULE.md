# Módulo: Proveedores

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/proveedores/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `proveedores` |
| Estado | `planeado` |
| Fase | FASE 11 — Clientes y proveedores |
| API prevista | `/api/v1/suppliers` |
| Prefijo de permiso | `proveedores` |

## Propósito
Maestro de proveedores: contacto, condiciones comerciales y estado, base del módulo de compras.

## Entidades principales
- `Proveedor` (datos generales, contacto, domicilio, condiciones, estado).

## Permisos previstos
`proveedores.ver`, `proveedores.crear`, `proveedores.editar`, `proveedores.eliminar`, `proveedores.exportar`.

## Dependencias / notas
- Contexto multiempresa: proveedores **por empresa**.
- Validación de duplicados y estados centralizados (`BORRADOR|PENDIENTE|APROBADO|...` cuando aplique).
- Depende de: `empresas` (contexto).
