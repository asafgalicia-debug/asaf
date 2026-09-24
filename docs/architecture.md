# Arquitectura actual

Estado: backend en desarrollo, fases 1â€“26 aplicadas segÃºn validaciÃ³n compartida el 2026-09-24. Este documento describe lo existente y distingue las funciones preparadas de las conexiones reales.

## Capas

- `backend/src/app.ts` crea la aplicaciÃ³n Express; `server.ts` inicia el listener y el bootstrap.
- `backend/src/routes/index.ts` monta `/api/v1` y conecta rutas de dominio.
- `backend/src/modules/<dominio>` contiene endpoints, lÃ³gica y modelos de cada mÃ³dulo.
- `backend/src/middleware`, `config`, `security`, `audit` y `errors` contienen infraestructura compartida.
- MongoDB Atlas es la persistencia del backend, mediante Mongoose.
- `apps/web`, `apps/mobile` y `shared` alojan los clientes y contratos compartidos; su interfaz final se abordarÃ¡ despuÃ©s.

## Flujo HTTP

`Cliente -> Express -> middleware de seguridad/CORS -> autenticaciÃ³n JWT -> tenant -> autorizaciÃ³n -> ruta/servicio -> Mongoose -> MongoDB`.

Las respuestas de error usan `{ ok: false, error: { code, message, errorId } }`. El tenant se toma del usuario autenticado, no de un `companyId` enviado libremente por el cliente. Las listas de dominio deben limitarse por empresa y sucursal cuando corresponda.

## MÃ³dulos principales

La API monta autenticaciÃ³n, usuarios, roles, empresas/departamentos, clientes, proveedores, productos/categorÃ­as, inventario, ventas, compras, finanzas, facturaciÃ³n, RRHH, producciÃ³n, proyectos, reportes, notificaciones, integraciones, IA, auditorÃ­a y otros dominios. El catÃ¡logo de manifiestos del nÃºcleo es actualmente explÃ­cito; agregar una ruta nueva requiere registrarla en `backend/src/routes/index.ts` y documentar sus permisos.

## LÃ­mites actuales

- La interfaz web/mÃ³vil todavÃ­a requiere integraciÃ³n con los contratos actuales.
- CRM y logÃ­stica tienen rutas en el backend, pero requieren validaciÃ³n de cobertura funcional.
- Integraciones externas permanecen pausadas hasta implementar adaptadores y secretos seguros.
- IA crea solicitudes pendientes; no se envÃ­an datos a modelos ni se simulan resultados.
- La emisiÃ³n fiscal real requiere configuraciÃ³n por paÃ­s/jurisdicciÃ³n y revisiÃ³n especializada.
