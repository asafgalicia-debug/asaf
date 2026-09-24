# Módulo: Logística

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/logistica/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `logistica` |
| Estado | `planeado` |
| **Fase** | **sin asignar** (inconsistencia I-07: existe en §6 pero no en §39. Propuesta: posterior a FASE 23. Requiere confirmación.) |
| API prevista | `/api/v1/logistics` |
| Prefijo de permiso | `logistica` |

## Propósito
Despachos y entregas: envíos, rutas, estados de entrega y trazabilidad de distribución.

## Entidades principales
- `Envio` (destino, fechas, estado).
- `Ruta`.
- `Entrega` (comprobante de recepción).

## Permisos previstos
`logistica.ver`, `logistica.crear`, `logistica.editar`, `logistica.autorizar`, `logistica.exportar`.

## Dependencias / notas
- Relación con `ventas` (pedido → despacho) e `inventario` (salida de almacén): integración a documentar en su fase.
- Conectores de paquetería externos → vía módulo `integraciones` (§25), nunca acoplados directo.
