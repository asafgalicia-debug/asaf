# Módulo: Inteligencia Artificial

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/inteligencia-artificial/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `inteligencia-artificial` |
| Estado | `planeado` |
| Fase | FASE 23 — IA |
| API prevista | `/api/v1/ai` |
| Prefijo de permiso | `ia` |

## Propósito
Componente empresarial de IA (§22): predicción de ventas e inventario, detección de anomalías, recomendaciones, análisis financiero, alertas inteligentes, resúmenes, asistente y automatización **controlada**. No es un chatbot decorativo.

## Entidades principales
- `ConfiguracionModelo` (modelo, alcance, parámetros).
- `Prediccion` / `Analisis` (resultado, fecha, módulo de origen).
- `SolicitudAprobacionIA` (acción crítica propuesta → aprobación humana).
- `Insight` (resumen/alerta inteligente).

## Permisos previstos
`ia.consultar`, `ia.configurar`, `ia.ejecutar` (propuestas automatizadas).

## Dependencias / notas
- **Regla crítica:** la IA **nunca** modifica información crítica sin autorización humana; las acciones críticas pasan por `SolicitudAprobacionIA` (aprobador con permiso).
- Lee datos vía services de otros módulos (con los mismos permisos/aislamiento), no accede directo a colecciones.
- Proveedor externo de IA → vía `integraciones` (§25).
- Requiere FASE 23: nada de esto se adelanta antes de tener datos y módulos base.
