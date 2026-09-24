# Módulo: Clientes

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/clientes/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `clientes` |
| Estado | `planeado` |
| Fase | FASE 11 — Clientes y proveedores |
| API prevista | `/api/v1/customers` |
| Prefijo de permiso | `clientes` |

## Propósito
Maestro de clientes con datos de contacto, domicilio y estado, como base de ventas, CRM y facturación.

## Entidades principales
- `Cliente` (datos generales, contacto, domicilio, estado, referencia a empresa).

## Permisos previstos
`clientes.ver`, `clientes.crear`, `clientes.editar`, `clientes.eliminar`, `clientes.exportar`.

## Dependencias / notas
- Contexto multiempresa: clientes **por empresa**.
- Validación de duplicados (mismo correo/RFC según reglas de FASE 11).
- Registro de cambios en auditoría (ej. cambio de teléfono: estado anterior → nuevo).
