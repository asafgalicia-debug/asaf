# Módulo: Integraciones

Ficha de diseño (FASE 1). El código se implementará en `backend/src/modules/integraciones/`
en la fase indicada. Índice general: `docs/modules.md`.

| Campo | Valor |
|---|---|
| ID | `integraciones` |
| Estado | `planeado` |
| Fase | FASE 22 — Integraciones |
| API prevista | `/api/v1/integrations` |
| Prefijo de permiso | `integraciones` |

## Propósito
Capa abstracta de conectores externos (§25): facturación, bancos, CRM externo, e-commerce, logística, correo, servicios de IA y APIs de terceros.

## Entidades principales
- `Integracion` (proveedor, tipo, credenciales cifradas, estado, último error).
- Registro de ejecuciones (éxito/fallo, payload de respuesta resumido).

## Permisos previstos
`integraciones.ver`, `integraciones.configurar`.

## Dependencias / notas
- **Principio:** ningún módulo de negocio se acopla directo a un proveedor; consume esta capa (§25).
- Las credenciales de terceros **jamás** en código ni en `.env` compartido sin cifrado: se cifran y quedan en BD con auditoría de acceso.
- Los módulos consumidores (facturacion, logistica, notificaciones, ia) se registran como "usuarios" de la integración.
