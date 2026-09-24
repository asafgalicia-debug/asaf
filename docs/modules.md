# CatÃ¡logo y estado de mÃ³dulos

Las rutas se montan desde `backend/src/routes/index.ts`; las fichas funcionales y permisos deben mantenerse sincronizados con cada mÃ³dulo y su `manifest.ts`.

## Dominios nÃºcleo trabajados

AutenticaciÃ³n, usuarios, roles, empresas, departamentos, clientes, proveedores, productos, categorÃ­as, almacenes y transferencias, ventas, compras, finanzas, facturaciÃ³n en borrador, RRHH, producciÃ³n, proyectos, reportes, notificaciones, integraciones e inteligencia artificial.

TambiÃ©n hay dominios adicionales en el router (CRM, logÃ­stica, mantenimiento, analÃ­tica, calidad, activos, adquisiciones, soporte, continuidad, riesgo y otros). La presencia de rutas no significa que cada subdominio estÃ© completo ni listo para producciÃ³n.

## Persistencia y estado funcional

- Los mÃ³dulos de negocio implementados guardan y consultan datos MongoDB con filtros de empresa/sucursal conforme al dominio.
- Reportes guardan una instantÃ¡nea calculada por el servidor; datos de inventario se resumen por catÃ¡logo y almacenes activos.
- Notificaciones internas se persisten por usuario. Email y push quedan en `PENDING` hasta implementar el adaptador.
- Integraciones se guardan pausadas y no aceptan secretos en su configuraciÃ³n. No hacen llamadas a terceros todavÃ­a.
- IA registra solicitudes `PENDING`; no genera resultados ni transmite informaciÃ³n externamente.
- Empleados enlazan usuario activo; proyectos enlazan clientes activos; Ã³rdenes y ventas validan referencias de tenant.
- FacturaciÃ³n mantiene borradores; emisiÃ³n fiscal queda pendiente de parÃ¡metros y cumplimiento por jurisdicciÃ³n.

## Registro de rutas

La lista efectiva y sus prefijos estÃ¡n en `backend/src/routes/index.ts`. El catÃ¡logo expuesto por `GET /api/v1/modules` es explÃ­cito en `backend/src/core/moduleRegistry.ts`; por ello agregar un mÃ³dulo exige actualizar rutas, permisos, manifiesto/catÃ¡logo y pruebas correspondientes.
