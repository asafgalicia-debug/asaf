# Módulo: Finanzas

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/finanzas/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `finanzas` |
| Estado | `planeado` |
| Fase | FASE 15 — Finanzas |
| API prevista | `/api/v1/finance` |
| Prefijo de permiso | `finanzas` |

## Propósito
Control financiero interno (§21): cuentas, ingresos, egresos, movimientos, categorías, saldos y reportes financieros básicos.

## Entidades principales
- `CuentaFinanciera`.
- `Ingreso`, `Egreso` (categoría, monto, fecha, referencia).
- `MovimientoFinanciero` (detalle de saldos).
- `CategoriaFinanciera`.

## Permisos previstos
`finanzas.ver`, `finanzas.crear`, `finanzas.editar`, `finanzas.autorizar` (egresos relevantes), `finanzas.exportar`.

## Dependencias / notas
- Mapeo §6: ítems 18 (Finanzas), 19 (Cuentas), 20 (Ingresos), 21 (Egresos) → este módulo.
- **NO** se implementa contabilidad fiscal mexicana sin especificación (§21): la arquitectura queda preparada para incorporar reglas fiscales después.
- Conciliación bancaria: preparada en diseño, pendiente de especificación.
- Depende de: `empresas`. Relación con `ventas`/`compras`: referencias, no duplicación.
