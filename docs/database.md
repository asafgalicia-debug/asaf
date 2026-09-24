# Base de datos â€” MongoDB

La aplicaciÃ³n usa Mongoose y obtiene la URI y el nombre de base de datos desde la configuraciÃ³n validada por `backend/src/config/env.ts`. No guardes URI ni contraseÃ±as en cÃ³digo o documentaciÃ³n. El archivo `.env` existente se conserva local.

## Tenancy e Ã­ndices

Las colecciones de dominio guardan `companyId` y, cuando aplica, `branchId`. Los servicios filtran sus consultas con el tenant de la sesiÃ³n. Hay Ã­ndices compuestos para consultas frecuentes como empresa/sucursal/fecha, cliente por nombre y producto por nombre/SKU.

La conexiÃ³n limita el pool a 20 conexiones, permite hasta 2 aperturas simultÃ¡neas, conserva `minPoolSize: 0`, limita espera en cola a 5 segundos y mantiene selecciÃ³n de servidor a 8 segundos. Ajusta esos lÃ­mites con mediciones de carga reales antes de cambiarlos.

## ComprobaciÃ³n

Desde `backend`, `npm.cmd run check:mongodb` ejecuta la comprobaciÃ³n de conexiÃ³n configurada. No ejecutes scripts de seed contra datos reales sin revisar primero el alcance y la base seleccionada.

Los Ã­ndices de Mongoose se crean segÃºn la configuraciÃ³n del entorno al compilar/usar los modelos. En producciÃ³n, planifica creaciÃ³n y revisiÃ³n de Ã­ndices sobre una copia/ventana de mantenimiento acorde al tamaÃ±o de la base.
