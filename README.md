# ERP Universal Modular

ERP multiempresa y multisucursal en desarrollo. El backend estÃ¡ organizado por mÃ³dulos y usa Express, TypeScript, MongoDB/Mongoose, JWT y npm workspaces. Las interfaces web y mÃ³vil se mantienen para una etapa posterior de integraciÃ³n y revisiÃ³n.

## Requisitos

- Node.js LTS y npm.
- MongoDB Atlas o una instancia MongoDB accesible.
- Variables configuradas en el `.env` existente en la raÃ­z. No copies secretos en documentaciÃ³n ni los compartas por chat.

## Instalar y ejecutar

Desde la raÃ­z del proyecto:

```powershell
npm.cmd install
npm.cmd run dev:api
```

La API se inicia en el puerto indicado por `PORT` (por defecto `4000`). La comprobaciÃ³n de vida estÃ¡ en `/health/live`; la API versionada estÃ¡ bajo `/api/v1`.

Para validar el backend, entra a `backend` y ejecuta cada comando por separado:

```powershell
cd .\backend
npm.cmd run typecheck
npm.cmd test
```

## Estructura

- `backend/src/modules`: rutas, servicios y modelos por dominio.
- `backend/src/middleware`, `config`, `security`, `audit`, `errors`: infraestructura compartida.
- `apps/web` y `apps/mobile`: aplicaciones cliente; sus interfaces e integraciÃ³n final siguen pendientes de revisiÃ³n.
- `shared`: recursos compartidos entre paquetes.
- `docs`: arquitectura, API, datos, seguridad, pruebas, despliegue y mÃ³dulos.

## Estado actual

Las fases 1 a 26 del plan se han aplicado mediante scripts con respaldo. En los mÃ³dulos cubiertos, la persistencia de negocio usa MongoDB y las rutas derivan el tenant de la sesiÃ³n. La Fase 24 verificÃ³ la capa HTTP; la Ãºltima ejecuciÃ³n comunicada fue `typecheck` correcto y 112 pruebas aprobadas en 67 archivos antes de los cambios de optimizaciÃ³n de la Fase 26. DespuÃ©s de esa fase se confirmÃ³ `typecheck`; las pruebas deben repetirse si se necesita validar el estado completo actual.

Integraciones externas y anÃ¡lisis de IA estÃ¡n modelados como configuraciones/solicitudes pendientes: no conectan con proveedores ni generan resultados automÃ¡ticamente. La facturaciÃ³n no declara cumplimiento fiscal sin configuraciÃ³n jurisdiccional y revisiÃ³n correspondiente.

## Seguridad del entorno

`.env` permanece local y debe estar excluido de Git. Para revisar quÃ© variables requiere esta copia, consulta `.env.example` y `backend/src/config/env.ts`; conserva las credenciales actuales y no las pegues en mensajes.
