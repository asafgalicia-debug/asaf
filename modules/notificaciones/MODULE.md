# Módulo: Notificaciones

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/notificaciones/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `notificaciones` |
| Estado | `planeado` |
| Fase | FASE 21 — Notificaciones |
| API prevista | `/api/v1/notifications` |
| Prefijo de permiso | `notificaciones` |

## Propósito
Bandeja de notificaciones, reglas de alerta y orquestación de canales (§23): interno, correo y push móvil.

## Entidades principales
- `Notificacion` (destinatario, canal, lectura, estado).
- `ReglaAlerta` (evento → destinatarios → canal; ej. stock mínimo, egreso alto).
- `Plantilla` (asunto/cuerpo por canal).

## Permisos previstos
`notificaciones.ver`, `notificaciones.configurar`.

## Dependencias / notas
- Separación R3: la **entrega** (correo/push/interno) vive en `backend/src/notifications/` (infraestructura); este módulo expone la API (bandeja, reglas, configuración).
- Proveedor de correo/push se conecta vía `integraciones`, no acoplado en el módulo (§25).
- Depende de: `usuarios` (destinatarios).
