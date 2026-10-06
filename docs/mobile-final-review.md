# Revisión final de la ampliación Android

## Incluido en la nueva APK

- Inicio con indicadores autenticados y reintento de conexión.
- Navegación a módulos con desplazamiento al contenido seleccionado.
- Clientes, proveedores, categorías y productos: consulta y altas con validación.
- Edición de contactos/productos y nombres de categorías/almacenes.
- Estados comerciales de ventas/compras con comprobación de cambios simultáneos.
- Inventario: almacenes, entradas, salidas, transferencias, existencias e historial.
- Ventas y compras: listados, contactos/productos activos, captura y confirmación.
- Finanzas: cuentas y movimientos de caja, consulta y captura con confirmación.
- Actividad: últimos 50 eventos de auditoría de la sucursal, sujetos a permisos.
- Perfil: identidad, permisos y empresa/sucursal comprobadas con la API.

## Comprobaciones finales con sesión del usuario

1. Abrir cada módulo y confirmar que el contenido queda visible al seleccionarlo.
2. Confirmar saldo de Producto de prueba: entrada 5 menos salida 2 = 3.
3. Revisar transferencias con dos almacenes y sus efectos en ambos saldos.
4. Revisar ventas/compras con contactos activos, cancelación de la confirmación y actualización del listado después de un guardado autorizado.
5. Revisar Finanzas con cuentas válidas, fechas e importes; son registros contables y no operaciones bancarias.
6. Abrir Actividad y Perfil; verificar comportamiento con permisos y sesión expirada.

Las altas de prueba ya realizadas permanecen en la base conectada. No repetir referencias confirmadas ni crear registros adicionales sin decidir qué datos conservar.

## Límites y pendientes del ERP

Esta ampliación cubre las pantallas principales de la app; no termina todos los módulos del ERP. Los nombres de categorías y almacenes ya se pueden editar. La edición de códigos de categorías y almacenes ya tiene API y pantalla; la conciliación comercial sigue pendiente. Clientes, proveedores y productos ya tienen listas paginadas en el servidor. Los selectores comerciales y de inventario, incluidos categorías y almacenes, consultan páginas y preservan la selección. Finanzas móvil consulta cuentas y movimientos en páginas de 20; la web también incorpora consulta financiera paginada y formularios de cuentas/caja. Ventas y compras ya tienen listas paginadas en el servidor. Ventas/compras no modifican existencias automáticamente. No existe conciliación automática, cumplimiento fiscal certificado, conexiones bancarias ni integración operativa de IA. La firma Android actual es de desarrollo, falta distribución de producción y prueba en dispositivo físico. La interfaz protegida nueva necesita validación final con la sesión del usuario; las pruebas de contratos no sustituyen esa revisión visual.

## Edición de contactos preparada localmente

Clientes y proveedores permiten editar nombre, identificador fiscal y correo. PATCH exige usuarios.editar, valida los tres campos y filtra por empresa y sucursal. Conserva estado y genera auditoría UPDATE sin datos personales. La app confirma identidad y valores antes de mostrar éxito; advierte ante respuestas inciertas.

Validación: typecheck de los tres workspaces; 34 pruebas móviles y pruebas de actualización, conflictos y aislamiento del backend. Completado: rutas desplegadas y APK de contactos generada e instalada. La APK ampliada anterior no contiene esta función.


### Publicación de rutas de edición — 2 de octubre de 2026

Commit a7f6e68 enviado a origin/master. Render: /health/ready = 200; PATCH /api/v1/customers/:id y /api/v1/suppliers/:id = 401 sin sesión, confirmando las rutas protegidas. Pruebas nuevas de servicios/rutas: 12 correctas; móviles: 34 correctas. La compilación Android se verifica por separado antes de instalar.


### APK de contactos verificada e instalada

Archivo: output/nucleo-erp-contactos.apk. SHA256: 5741143B68F4270E7574922C02C074B917484292CD36CCA1B146A66F1723EAD4. Firma de desarrollo válida (v2). Compilación Android correcta; bundle con una instancia de React 19 y React Native 0.79.6. Instalación con adb install -r correcta, arranque Status ok y sin errores ReactNativeJS/AndroidRuntime del proceso. Captura output/nucleo-contactos.png: API conectada, formulario de acceso visible.

Validación final: 159 pruebas del backend y 34 móviles correctas. La ejecución completa simultánea con Gradle tuvo tres timeouts; los casos afectados y la suite completa repetida después pasaron. Typecheck de los tres workspaces y build del backend correctos. La edición autenticada necesita revisión visual con sesión del usuario; no se modificaron contactos de producción durante estas comprobaciones.

## Edición de productos

La app permite editar nombre, categoría activa y precio desde el catálogo. Conserva SKU, estado e identificador. La API filtra por empresa, exige usuarios.editar y registra UPDATE sin datos personales. Rechaza cambios de SKU/empresa/estado, categorías ajenas/inactivas e importes negativos o con más de dos decimales. El precio nuevo no modifica importes de ventas ya registradas ni existencias.

Validación previa a publicación: 165 pruebas del backend y 35 móviles; typecheck de los tres workspaces y build del backend correctos. Commit 52e1619 enviado a origin/master. Compilación e instalación Android se registran al concluir.


### APK de productos

output/nucleo-erp-productos.apk: SHA256 9D270F3644B45179AA3372F49A857285907471F33029FBE2AA02DD4090239E6F. Firma de desarrollo v2 verificada. Bundle incorpora ProductForm con updateProductRequest; React y React Native tienen una instancia cada uno. Instalación con adb install -r correcta y arranque Status ok. Render confirma readiness 200 y ruta PATCH de productos protegida con 401 sin sesión. Pendiente revisión visual de edición autenticada.


## Estados comerciales

Ventas: PENDIENTE a PAGADA o CANCELADA. Compras: PENDIENTE a APROBADA o CANCELADA; APROBADA a RECIBIDA o CANCELADA. Los estados finales no se reabren. Cada cambio exige usuarios.editar, confirmación móvil y auditoría. La API compara el estado anterior de forma atómica, filtrando empresa/sucursal; los conflictos devuelven 409. El cliente confirma identidad, estado e importes sin cambios antes de mostrar éxito. No procesa pagos ni crea movimientos de caja/inventario.

Commit 79860ed enviado a origin/master. Validación: 180 pruebas backend, 36 móviles, revisión de tipos y build del backend correctos. No se modificaron registros de producción en estas verificaciones.

### APK comercial instalada y verificada

Archivo vigente: output/nucleo-erp-comercial.apk, 58,466,319 bytes. SHA256 D2AC17737D981600EBD27D546C3BFA97E97C133852CEE51F1F3CBD04BD7710B3. Compilación Android correcta (204 tareas), firma de desarrollo v2 válida. Bundle incorpora edición de productos y acciones de estados; una instancia de React y React Native. Instalación adb install -r correcta, arranque Status ok. Captura output/nucleo-comercial.png muestra API conectada; sin errores ReactNativeJS/AndroidRuntime del proceso al revisar. Render: readiness 200 y ambas rutas PATCH de estados devuelven 401 sin sesión.

Revisión autenticada pendiente: editar un producto sin alterar SKU, cancelar un diálogo comercial, comprobar transición de estado en un registro autorizado y verificar conflicto al trabajar con datos desactualizados. No se hicieron cambios comerciales ni ediciones de productos de producción durante estas pruebas. Esta entrega no completa aún la gestión de códigos de categorías/almacenes, paginación del servidor, conciliación, firma de distribución y demás integraciones del ERP.



## Nombres de categorías y almacenes

Se pueden renombrar desde Productos e Inventario. Se conservan identificador, código, estado y referencias de existencias. La API limita categorías por empresa y almacenes por empresa/sucursal, exige usuarios.editar y compara el nombre anterior para detectar cambios concurrentes. La interfaz bloquea guardados simultáneos en los formularios relacionados. Validación: 192 pruebas del backend, 37 móviles y comprobación de tipos. Revisión autenticada pendiente: renombrar, comprobar etiquetas de productos/existencias y verificar un conflicto con datos desactualizados.

APK actual: output/nucleo-erp-catalogos.apk, 58,471,819 bytes. SHA256 0474EFCFA2D0973F2CC1AADBCD3B71A379EF69C69BBCE3E70AA09AEC1990F5F5. Compilación correcta, 204 tareas; firma de desarrollo v2 verificada; bundle incluye NameEditor y una sola instancia React/React Native. Instalación conservando datos correcta y arranque Status ok. Backend enviado en eea5fda; al verificar, Render todavía devolvió 404 en las dos nuevas rutas PATCH: despliegue remoto pendiente de confirmar. La comprobación no envió credenciales ni modificó registros.


### Verificación remota — 3 de octubre de 2026

Readiness 200 y ambas rutas PATCH de categorías/almacenes devuelven 401 sin autenticación, confirmando que están registradas en Render. Queda superada la nota anterior de 404. No se modificaron registros. Se bloqueó Actualizar/Volver al panel en los catálogos durante un guardado y se reforzó el bloqueo de productos mientras se renombra una categoría.

APK de revisión del 3 de octubre: output/nucleo-erp-catalogos-revision.apk, 58,472,039 bytes, SHA256 8A897B8D78291FC6BF4627C93091A02B9A13B37CEBF822D91A63A01A4B971D20. Build Android correcto (204 tareas), firma de desarrollo v2 verificada. Bundle confirma el bloqueo de guardados y una sola instancia de React y React Native. Las 37 pruebas móviles y typecheck pasaron. adb install -r Success, arranque Status ok. La revisión de formularios autenticados sigue pendiente; la comprobación remota de rutas no valida por sí sola guardados en producción.


## Activación y desactivación — 3 de octubre de 2026

Categorías y almacenes admiten cambio ACTIVE/INACTIVE por PATCH /:id/status, con permiso usuarios.editar, aislamiento por empresa y por sucursal en almacenes y comparación atómica del estado anterior. Solo se actualiza el estado: identificadores, códigos, nombres, productos y movimientos se conservan. Se registran los estados anterior/nuevo en auditoría. La app pide confirmación, permite reactivar categorías inactivas y excluye las inactivas de la selección de productos. Almacenes inactivos siguen visibles en existencias/historial y no se ofrecen en movimientos nuevos. No se modificaron registros de producción durante las comprobaciones. Validación: 208 pruebas backend, 39 móviles, typecheck y build backend. Commit publicado bc1bfb7. Pendiente revisión autenticada de los diálogos y estados; no sustituye la validación con sesión.
Render comprobado: PATCH /categories/:id/status y /warehouses/:id/status devolvieron 401 sin sesión, confirmando el registro de ambas rutas. No se enviaron credenciales ni escrituras autenticadas.

APK output/nucleo-erp-estados-catalogo.apk, 58,477,063 bytes. SHA256 BCEF68FD5D81799995CAFA783858A36DB3A6D1332315A1BC7326A9D64AECA796. Build correcto (204 tareas), firma de desarrollo v2 verificada; bundle incluye StatusEditor y una sola instancia de React y React Native. Instalación adb install -r Success. Sigue siendo firma de desarrollo. Revisar con sesión los diálogos, la desaparición de registros inactivos en selectores y su reactivación; no se cambiaron estados de producción en estas pruebas.


## Páginas de catálogos — 3 de octubre de 2026

Clientes, Proveedores y Productos incorporan GET /page con búsqueda literal insensible a mayúsculas, cursor por identificador descendente y límite predeterminado 20 (máximo 50). Los contactos se filtran por empresa/sucursal y productos por empresa. La app usa páginas de 20 con Buscar, Ver todos, Anterior y Siguiente; las solicitudes anteriores se cancelan. No muestra un total global inventado. Guardados confirmados y Actualizar regresan a la primera página. Las rutas originales se conservan para web y selectores auxiliares, que aún descargan directorios completos. El orden muestra identificadores más recientes primero y no constituye una instantánea: cambios concurrentes requieren refrescar. Validación: 223 pruebas del backend, 41 móviles, comprobación de tipos y build backend. Commit 7dce2c4 publicado. No se crearon registros de producción para simular catálogos grandes. Revisión autenticada pendiente: búsqueda, páginas, vuelta atrás y guardado desde una página posterior.
Render: GET /customers/page, /suppliers/page y /products/page respondió 401 sin autenticación, confirmando las tres rutas publicadas. No se modificaron registros de producción.

APK output/nucleo-erp-catalogos-paginados.apk, 58,479,327 bytes. SHA256 7508C9C94AE6627CF2F92C76D8FB2049D0D2193D8482A126544E29BB4965405E. Build Android correcto (204 tareas), firma de desarrollo v2 verificada, bundle confirma catalogServerPage y una instancia de React/React Native. adb install -r Success. La revisión con sesión sigue pendiente y la firma no es de distribución.


## Ventas y compras paginadas — 3 de octubre de 2026

GET /sales/page y /purchase-orders/page ofrece cursor descendente, límite 20 (máximo 50) y filtro opcional de estado validado para cada módulo. Empresa y sucursal provienen de la sesión. Se conservan los endpoints originales. Android incorpora filtros Todos/Pendiente y estados específicos, navegación anterior/siguiente y actualización desde la primera página tras un guardado. Las acciones de estado conservan su comprobación de concurrencia. No se calculan totales globales ni se ejecutan cobros o movimientos de inventario. Selectores de contactos/productos siguen descargando directorios completos. Validación: 235 pruebas backend, 43 móviles, typecheck de las tres aplicaciones y build backend. No se crearon operaciones de producción para probar páginas. Revisión autenticada pendiente: filtros, páginas y cambio de estado con una consulta filtrada.
Commit cd1c1f3 publicado. Render comprobado: /sales/page y /purchase-orders/page respondieron 401 sin autenticación, confirmando las rutas nuevas; no se enviaron credenciales ni se crearon ventas/compras.

APK output/nucleo-erp-comercial-paginado.apk, 58,481,775 bytes. SHA256 39C9864C54364D7C9589F8AD3AB7CA56CF8BAC96705B92A171A0071A97E08FB0. Compilación Android correcta (204 tareas), firma de desarrollo v2 válida, bundle confirma transactionPageRequest y una sola instancia de React y React Native. Instalación adb install -r Success. Sigue pendiente revisión de filtros/páginas y estados con sesión; estas comprobaciones no escribieron operaciones de producción.


## Selectores comerciales por páginas — 3 de octubre de 2026

Clientes/proveedores y productos en operaciones nuevas usan búsqueda explícita y páginas de 20 registros activos. La selección se conserva al navegar. El historial solicita únicamente los nombres de los identificadores de su página (máximo 20 por catálogo), incluyendo referencias inactivas; registros no disponibles conservan su identificador. El backend valida status e ids, rechaza consultas combinadas con búsqueda/cursor, limita identificadores y conserva empresa/sucursal del servidor. Validación: 239 pruebas backend, 44 móviles, typecheck y build backend. Commit 1e54f89 publicado desde output/deploy-selectores, copia limpia basada en cd1c1f3: Git del repositorio principal no pudo leer packs almacenados por OneDrive. No se borró historial ni se trasladaron cambios ajenos. Las comprobaciones de API sin sesión devolvieron ready 200 y rutas protegidas 401; no prueban el filtro autenticado.

La primera compilación Android falló por archivos no legibles de node_modules/@react-native/gradle-plugin. Se recuperó el paquete oficial 0.79.6 de npm conforme a package-lock (la carpeta afectada reportaba 0.76.3); carpeta anterior conservada en output/gradle-plugin-onedrive-backup. APK y revisión autenticada pendientes hasta finalizar la nueva compilación.


### Recuperación del entorno Android

OneDrive volvió a afectar ModelAutolinkingAndroidProjectJson.kt después de restaurar el plugin, y app.config generado por Expo tampoco era un archivo regular legible. Los intentos fallidos no instalaron ni reemplazaron el APK anterior. Se creó una copia de código en C:/Users/asafg/AppData/Local/Temp/nucleo-erp-selectores-20261003, excluyendo node_modules, build, dist, .gradle y .cxx, y se ejecutó npm ci con el mismo package-lock (1031 paquetes). Gradle y las dependencias de esta copia quedan fuera de OneDrive. La compilación usa ORG_GRADLE_PROJECT_kotlin.compiler.execution.strategy=in-process y la API de Render. Metro conserva la app móvil, shared y dependencias, excluye web/backend, salidas nativas y las copias raíz de React 18/React Native 0.76; su resolver mantiene React 19/React Native 0.79 del workspace móvil. La carpeta temporal queda disponible para futuras compilaciones; sincronizar solo código, nunca node_modules ni salidas del proyecto afectado. No cambiar referencias Git del repositorio original: su HEAD sigue cd1c1f3, mientras origin/master fue actualizado a 1e54f89 desde output/deploy-selectores. APK nuevo todavía pendiente de verificación e instalación.


### APK verificado e instalado

La compilación temporal terminó correctamente (39m 45s, 204 tareas ejecutadas). Metro compiló 589 módulos; el mapa de fuentes confirma CatalogSelector con catalogServerPage y TransactionPanel con catalogLookup, sin catalogRequest en la pantalla comercial. Una instancia de React 19.0.0 y React Native 0.79.6. APK: output/nucleo-erp-selectores-paginados.apk, 58,485,831 bytes; SHA256 FAAE6B9FD5639B140FD416B1AD6BD5EEB50B207EA98DABF8524D789B9C3F2AEA. Firma de desarrollo v2 verificada; no es una firma de distribución para Play. adb install -r Success; arranque COLD Status ok (12,382 ms). Captura output/nucleo-selectores-paginados.png confirma API conectada y formulario de acceso; sin errores ReactNativeJS/AndroidRuntime del proceso iniciado. /health/ready devolvió 200 ready. Estos controles no prueban las pantallas protegidas: queda pendiente revisión con sesión de búsqueda/páginas, conservación de la selección y creación/estados comerciales. No se enviaron credenciales ni se crearon registros de producción durante estas verificaciones. El APK anterior no fue desinstalado ni se borraron datos.

Inventario: StockForm reutiliza CatalogSelector para buscar productos activos en páginas de 20 y conservar la selección al navegar. Validado con typecheck móvil y 44 pruebas aprobadas. Los directorios usados para nombres de existencias y almacenes siguen pendientes de paginación; no se consideran terminados.

APK de inventario compilado e instalado con install -r; arranque frío Status ok. Archivo output/nucleo-erp-inventario-buscador.apk, SHA256 F0A9209A998648311843C1BAA3BE01BDA4502F84ABB70BF7B0EA71997D12E5CC. Ninja requirió GRADLE_USER_HOME con alias corto TEMP/nucleo-gradle y regeneración respaldada de .cxx. Prueba visual autenticada del selector pendiente.

2026-10-04: almacenes /page con búsqueda literal por nombre/código, estado activo/inactivo, cursor y lookup limitado a 20 IDs. Scope empresa/sucursal autenticado y permiso usuarios.ver; índices de paginación. Publicado backend a0a70fc. StockForm usa WarehouseSelector para origen/destino activo y rechaza destino igual al origen. Typecheck 3 workspaces, 244 pruebas backend y 46 móviles aprobadas; backend build aprobado. Directorios completos para etiquetas/administración y existencias todavía pendientes de migración.

APK output/nucleo-erp-almacenes-paginados.apk compilado e instalado install -r; SHA256 3435492347C02ED1E24143598EABA9F09769ED179704D8A7919B7F0CB0173536. Sourcemap confirma WarehouseSelector y ambos selectores StockForm. Render /warehouses/page 401 sin sesión confirma ruta protegida desplegada. Ninja 3.22.1 vuelve a fallar al reutilizar dependencias con rutas largas aun con junction; se respaldó/regeneró expo-modules-core/android/.cxx, build exitoso 4m14s. La solución permanente de caché/rutas queda pendiente.

2026-10-04: /stock/page agrupa saldos (incluye origen/destino de transferencias) antes de filtrar/paginar; cursor compuesto almacén:producto, búsqueda literal global por nombres/SKU/código/IDs, etiquetas con lookup de empresa/sucursal. Móvil carga 20 existencias y usa Anterior/Siguiente; Buscar/Ver todos reinician página, sin total global inventado. Publicado 1480bd1; typecheck 3 workspaces, backend build, 249 pruebas backend, 48 móviles y 8 MongoDB local aislado aprobadas. La agregación aún recorre movimientos para calcular saldos; no se introduce una tabla materializada. Directorios completos de nombres y administración en InventoryPanel siguen pendientes de migración.

APK output/nucleo-erp-existencias-paginadas.apk build exitoso 31m49s, instalado install -r; SHA256 BFAC0402F181F9731DE98446C76E74940E3CC8EB3C1DB3841377EA0A174CC6A7. Sourcemap verifica InventoryPanel usa stockPageRequest y balanceCursors. Salud remota 200 y /stock/page 401 sin sesión (router autentica incluso rutas desconocidas, por tanto 401 no prueba por sí solo la versión desplegada); revisión autenticada pendiente.

2026-10-04: InventoryPanel ya no llama catalogRequest ni warehousesRequest. WarehouseDirectory muestra 20 almacenes incluidos inactivos, mantiene edición de nombre/estado. StockForm usa selecciones de sus selectores paginados y el backend sigue validando pertenencia/actividad al registrar. Al modificar almacenes limpia origen/destino y conserva producto/cantidad/referencia. Historial solicita nombres sólo de su página (máximo25movimientos), en chunks20 IDs, y mantiene inactivos para etiquetas históricas. Fallos de nombres conservan movimientos con IDs. Typecheck móvil y 50 pruebas aprobadas.

APK output/nucleo-erp-inventario-directorios-paginados.apk build exitoso3m15s, instalado install -r y arranque frío Status ok13s. SHA256 338DA0F90241FFE07E3183253AA92CB8F930FFCAB65E02F48E7635D3109F636F. Para este cambio exclusivamente TypeScript se omitieron las cuatro tareas buildCMakeRelWithDebInfo de expo-modules-core, reutilizando binarios previos; comparación ZIP confirmó las48bibliotecas .so idénticas al APK anterior. No usar esta reutilización si cambian dependencias/configuración/código nativo. Sourcemap confirma WarehouseDirectory y consultas completas eliminadas del panel. Revisión funcional autenticada pendiente.

2026-10-04: backend categorías /page con cursor, búsqueda literal por nombre/código, estado e IDs limitados. Scope empresa autenticada y usuarios.ver; índices compañía/cursor y compañía/estado/cursor. Build backend y 254 pruebas aprobadas. Integración de selectores/directorio de categorías móvil pendiente; APK instalado de Inventario permanece como última versión móvil.

2026-10-04: ProductForm reemplaza categoryDirectoryRequest por categoryPageRequest20 + categoryLookup de categoría seleccionada. Busca nombre/código, conserva selección fuera de página, administra categorías inactivas, refresca primera página al crear. Al cambiar producto en edición consulta su categoría propia; al desactivar selección limpia ID. Typecheck móvil y 52 pruebas aprobadas. APK en empaquetado; revisión funcional autenticada pendiente.


APK de categorías completado: output/nucleo-erp-categorias-paginadas.apk. Build exitoso 4m46s; SHA256 B1C99AAE84202674C0C26A3C55212A4E14CB19C1E1F5FCC2D4F1CA50587BCAF5. Comparación ZIP confirma las 48 bibliotecas nativas idénticas al APK de directorios; sourcemap confirma categoryPageRequest y categoryLookup en ProductForm, sin categoryDirectoryRequest. Instalado con adb install -r Success, arranque Status ok; proceso sin errores ReactNativeJS/AndroidRuntime. Captura output/nucleo-categorias-paginadas.png confirma API conectada y acceso disponible. Render categories/page devuelve 401 sin sesión; prueba funcional autenticada de búsqueda, navegación, edición y selección pendiente. No se borraron datos ni se introdujeron credenciales o registros de producción.


2026-10-04: edición de códigos de categorías y almacenes mediante PATCH /:id/code, permiso usuarios.editar y scope de sesión. Actualización atómica con expectedCode; normalización a mayúsculas, conflictos por duplicados o valores desactualizados. Conserva identificador, nombre, estado y referencias. Android incorpora CodeEditor en ambos directorios y actualiza selección/etiquetas al confirmar. Backend publicado 28bf8da; build backend, tipos backend/web/móvil, 269 pruebas backend, 53 móviles y 9 pruebas MongoDB local aislado aprobadas. APK en compilación; revisión autenticada pendiente. Por indicación del usuario, la problemática del documento permanece fuera del trabajo del ERP.

APK output/nucleo-erp-edicion-codigos.apk compilado en 3m09s e instalado con install -r Success; arranque COLD Status ok (8992 ms). SHA256 660182AEC9579C58ECD75008F57028ED171D39AC03E76F3B3F0C15929A2B0ACD. Sourcemap verifica CodeEditor en ProductForm y WarehouseDirectory; comparación de las 48 bibliotecas nativas idénticas al APK anterior. Rutas PATCH categories/warehouses/:id/code responden 401 sin credenciales en Render. Sin errores ReactNativeJS/AndroidRuntime del proceso iniciado. Captura output/nucleo-edicion-codigos.png. Revisión autenticada pendiente; no se cambió ningún código de producción durante las pruebas.


2026-10-04: Finanzas móvil usa /bank-accounts/page y /cash-movements/page (20 por página) con búsqueda literal, cursor descendente y filtros de entradas/salidas. La cuenta seleccionada se conserva al navegar; el servidor valida que esté activa y en la sucursal al guardar. API limita filtros y rechaza override de tenant. Las fechas de caja deben existir y los importes ser positivos con máximo dos decimales dentro del rango seguro. Índices empresa/sucursal/cursor. Publicado backend 9f37b30. Suite backend 278 pruebas aprobadas; después se añadió validación de guardados, con las 7 pruebas del archivo de rutas financieras aprobadas. 55 móviles, tipos de tres workspaces, backend build y 10 pruebas MongoDB local aislado aprobadas.

APK output/nucleo-erp-finanzas-paginadas.apk: compilación 1m29s, SHA256 8D4A9DA0AA2B9811BFCA4C89B09A503744040683B64A86AE21D0D66BB0BB539C. Sourcemap confirma FinancePageView; 48 bibliotecas nativas idénticas a la versión de códigos. Instalación -r Success, arranque COLD Status ok (10323 ms), sin errores ReactNativeJS/AndroidRuntime; captura output/nucleo-finanzas-paginadas.png confirma API conectada. Rutas financieras /page responden 401 sin sesión. Revisión protegida pendiente; no se escribieron operaciones financieras de producción.

Web: Clientes, Proveedores y Productos usan /page con búsqueda, 20 registros, Anterior/Siguiente y refresco de primera página después de crear. Directorio de clientes reutiliza CatalogDirectory y elimina la consulta completa duplicada. Build web aprobado, dist conservado en output/web-catalogos-paginados. Categorías, selectores comerciales, inventario, finanzas y demás vistas web todavía requieren completar su adaptación; esta entrega no declara terminado el ERP.


2026-10-04: Finanzas web reemplaza la pantalla provisional. Cuentas y caja con páginas de 20, búsqueda, filtros de entradas/salidas, selección de cuenta conservada al navegar, altas confirmadas antes de enviar y validación de identidad/payload de respuesta. Incluye bloqueo de guardados y cancelación al salir. Contratos y validaciones web: 4 pruebas aprobadas; build web aprobado. Artefacto output/web-finanzas. No publicado automáticamente ni probado aún con sesión en navegador; no se escribieron operaciones de producción.


2026-10-04: Ventas y Compras web usan TransactionDirectory con páginas de 20, filtros de estado, Anterior/Siguiente y Actualizar. Cambios de estado confirmados con expectedStatus y verificación de identidad, importes y referencias; no generan caja ni inventario automáticamente. Nombres de contactos/productos se consultan por IDs limitados a la página, mantienen inactivos históricos y separan las entidades al etiquetar. Un fallo de nombres conserva registros por identificador. Se eliminaron las consultas completas duplicadas de main. Build web y 8 pruebas de contratos/validaciones aprobados. Artefacto output/web-comercial-paginado; revisión visual autenticada pendiente y versión web no publicada. Selectores de alta comercial aún requieren paginación.


2026-10-04: altas comerciales web usan CatalogSelector con búsqueda y páginas de 20 contactos/productos activos. Selecciones conservadas fuera de página; el backend valida actividad y pertenencia al registrar. TransactionCreate elimina directorios completos, valida cantidades/costos con límites de precisión, pide confirmación y verifica la respuesta de creación pendiente. Guardados se bloquean y se cancelan al salir; resultados ambiguos requieren revisar listado antes de repetir. Build web y 14 pruebas aprobados, incluidas páginas activas y altas comerciales. Artefacto output/web-selectores-comerciales. Revisión visual autenticada pendiente; no se crearon ventas ni compras de producción.

2026-10-04: Inventario web usa existencias paginadas de 20 y selectores de productos/almacenes activos con búsqueda y selección conservada. Entradas, salidas y transferencias requieren confirmación; validación de cantidades, referencia y destino distinto. Respuestas ambiguas requieren buscar la referencia antes de repetir. Historial de 25 movimientos obtiene nombres por lotes acotados y conserva IDs si fallan las etiquetas. Se elimina la consulta completa duplicada de almacenes. Suite web: 23 pruebas aprobadas; TypeScript y build Vite aprobados. Artefacto output/web-inventario-paginado. No publicado, revisión visual autenticada pendiente, sin operaciones de producción. Pendientes: administración de catálogos web, categorías paginadas y revisión integral. La problemática del documento sigue fuera del alcance.

2026-10-04: Productos web elimina la descarga completa de categorías. CategorySelector consulta categorías activas en páginas de 20 con búsqueda, Anterior/Siguiente, reintento y selección conservada fuera de página. Crear categoría verifica ID, nombre, código normalizado y estado; selecciona el alta y refresca el selector. Guardados de categoría/producto se bloquean entre sí y verifican permiso local. Suite web: 25 pruebas aprobadas, TypeScript y Vite build aprobados. Artefacto output/web-categorias-paginadas. Revisión visual autenticada y administración de catálogos pendientes; no publicado ni escrito en producción.

2026-10-04: Administración web de categorías y almacenes: directorio paginado de activos/inactivos, edición de nombre/código y activación/desactivación con confirmación. PATCH usa expectedName/expectedCode/expectedStatus; conflictos exigen actualizar. Identidad y campos de respuesta verificados. Después del cambio se limpian selecciones del formulario asociado y refrescan etiquetas/selector. Guardados cancelados al desmontar. 28 pruebas web y build TypeScript/Vite aprobados. Artefacto output/web-administracion-catalogos. Revisión visual autenticada pendiente; no publicado ni escrito en producción. ERP completo todavía pendiente.

2026-10-04: Edición web de contactos y productos desde el directorio paginado. Contactos normalizan nombre/identificador/correo y verifican respuesta. Productos preservan SKU, editan nombre/precio/categoría con selector activo paginado y consulta acotada de categoría original. Confirmación, bloqueo mientras guarda, cancelación al desmontar y advertencia ante resultados ambiguos. Altas ocultas durante edición y administración de categorías bloqueada. 30 pruebas web y build aprobados. Artefacto output/web-edicion-catalogos; no publicado, revisión visual autenticada pendiente. Endpoints de contacto/producto todavía no implementan comparación del valor anterior para ediciones concurrentes. ERP completo sigue pendiente.

2026-10-04: Protección de ediciones web simultáneas de contactos/productos. PATCH admite expected con valores originales (contacto nombre/taxId/email; producto nombre/categoryId/price/sku) y MongoDB compara en el filtro atómico junto al tenant. Si no coincide devuelve 409 sin actualización. La web envía el snapshot; móvil anterior sigue compatible y sin esta protección hasta adaptar su contrato. 282 pruebas backend, 30 web y builds backend/web aprobados. Backend b6ec736 enviado a origin/master; despliegue Render todavía no verificado. Web artefacto output/web-edicion-protegida, sin publicación automática ni operaciones de producción. Revisión visual autenticada pendiente. No declara terminado el ERP.

2026-10-04: Móvil envía snapshot original en edición de contactos/productos, conservado al abrir formulario aunque cambien las páginas. Backend b6ec736 compara campos atómicamente. 56 pruebas móviles y tipos aprobados; prueba equivalente web de snapshot aprobada además de las 30 anteriores. APK output/nucleo-erp-edicion-protegida.apk compilado en 2m56s; SHA256 CDB6FDC820F72DAADF1BC3E48EB1CC438E1C5718B985CA214683F757C50C357E. Sourcemap confirma código nuevo, 48 bibliotecas nativas iguales a APK de finanzas. Instalación -r Success. Revisión autenticada y aceptación completa pendientes; no operaciones de producción.

2026-10-04: Panel y Analítica web reemplazan textos provisionales por SummaryPanel conectado a dashboard/summary, validando empresa/sucursal, fecha, métricas finitas y conteos enteros. Refresco/reintento, errores explícitos y CSV con contexto. Aclara acumulados no cancelados, caja manual neta, catálogo de empresa, moneda no informada y ausencia de filtros de periodo. Eliminada consulta duplicada del resumen. 32 pruebas web y build aprobados. Artefacto output/web-resumen-negocio. No publicado, revisión visual autenticada pendiente; no operaciones de producción. Reportes por periodo y conciliación comercial pendientes; ERP todavía no terminado.

2026-10-04: GET /reports/preview lectura autorizada reportes.ver, tipos sales/cash-flow, periodos actuales UTC día/semana lunes/mes/trimestre/año. Tenant solo de sesión y parámetros extra rechazados. Ventas no canceladas por createdAt hasta consulta; caja real CashMovement por date hasta día actual, neto entradas-salidas y conteos. No genera reportes persistidos ni movimientos. Web Analítica incluye filtros, refresco y CSV contextual; informa diferencias de fecha y límites. 285 pruebas backend y builds backend/web aprobados. Artefacto output/web-reportes-periodo; backend enviado a origin/master, despliegue todavía no verificado. Módulo anterior de reportes persistidos conserva contratos previos y requiere reconciliar su cálculo de caja. No publicado web ni verificado con sesión. ERP completo sigue pendiente.

2026-10-04: Reportes persistidos nuevos reutilizan previewReport para ventas y cash-flow/financial: caja manual CashMovement, UTC, ventana acotada, fuente y criterio explícitos. Tipo financial es resumen de caja, no estados contables completos. Inventario informa currentCatalog/periodApplied:false/asOf, sin fingir existencias históricas. Históricos conservados sin migración. POST estricto rechaza tenant override y filtros no aplicados; defensa adicional en servicio. Suite completa 287 pruebas aprobadas; tras agregar rutas, las 10 pruebas del bloque de reportes aprobadas. Backend build aprobado. Corrección publicada a origin/master; Render y aceptación autenticada pendientes. Conciliación comercial automática pendiente; ERP completo aún no finalizado.

2026-10-04: Base de conciliación comercial: recordCommercialStock exige sesión MongoDB con transacción activa y comparte stock/locks con esa sesión, conservando movimientos manuales y sus transacciones propias. Pruebas MongoDB local aislado verifican commit y rollback conjunto de stock/caja y conflicto por stock insuficiente. 12 integraciones reales, 290 pruebas generales y backend build aprobados. Todavía no se conecta venta/compra ni se expone endpoint comercial nuevo; no se escribieron operaciones de producción. Esta base no declara completada conciliación ni ERP.

2026-10-04: POST /commercial-settlements exige usuarios.editar, cuerpo estricto kind/sourceId/warehouseId/accountId/date y scope de sesión. Venta PENDIENTE→PAGADA registra ISSUE + INFLOW; compra APROBADA→RECIBIDA registra RECEIPT + OUTFLOW. Mismo commit MongoDB para estado, inventario, caja y comprobante único por empresa/sucursal/tipo/documento. Cantidad/total tomados del documento; total positivo con precisión segura. Reintento exacto devuelve comprobante existente; parámetros cambiados devuelven conflicto. Identidad de cuenta activa y almacén/producto validados, stock insuficiente revierte todo. Referencias determinísticas SALE:/PURCHASE:. 292 pruebas generales, 15 MongoDB real y backend build aprobados. Backend publicado a origin/master; Render sin verificar. Falta conectar botones web/móvil y revisar autenticado. Cambios de estado anteriores siguen disponibles y no generan movimientos; no se reconcilian documentos ya pagados/recibidos manualmente. No operaciones de producción. ERP todavía no finalizado.

2026-10-04: Web conecta operaciones conjuntas a listados comerciales con permiso de edición. Venta pendiente: Cobrar y entregar. Compra aprobada: Recibir y pagar. Selectores de almacenes/cuentas activos con búsqueda y páginas de 20; fecha, cantidad/importe visible y confirmación advierte si hubo movimientos manuales previos. Request no envía cantidades/importes/tenant; respuesta verifica IDs de comprobante/stock/caja, tenant, origen, seleccionados, fecha, cantidad, total y estado. Error ambiguo recomienda reintento idéntico protegido por idempotencia. Guardados bloqueados y cancelados al salir; confirmado muestra comprobante y refresca lista. 34 pruebas web y build aprobados. Artefacto output/web-operacion-comercial. No publicado ni verificado autenticado; móvil aún pendiente. No operaciones de producción. ERP completo todavía pendiente.

2026-10-04: Android conecta Cobrar y entregar / Recibir y pagar a la transacción conjunta. Selección paginada de almacén y cuenta activos, fecha de caja, confirmación de cantidad/importe y advertencia sobre movimientos manuales. La sesión conserva empresa/sucursal; el cliente verifica el comprobante contra ambas. Reintento idéntico protegido por comprobante único. 58 pruebas móviles aprobadas y TypeScript aprobado. Build release aprobado en 3m58s; 48 bibliotecas nativas iguales a edicion-protegida y sourcemap confirma SettlementForm. APK output/nucleo-erp-operacion-comercial.apk SHA256 9BE362BD64B1DCE2545D1D115E916E8A7F0B408373AB201E2D60645F46D790FF. Instalación -r exitosa y arranque COLD Status ok. No operaciones de producción; revisión autenticada del flujo comercial pendiente. Backend 0784a3c publicado, despliegue Render pendiente de confirmar; web compilada localmente. El ERP completo aún no finaliza. Problemática del documento excluida.

2026-10-04: Reportes Android de ventas y flujo de caja por día, semana desde lunes, mes, trimestre y año actuales UTC. Consulta readonly /reports/preview visible con reportes.ver; verifica empresa/sucursal, tipo, periodo, base temporal, fechas y métricas. El flujo neto puede ser negativo; otras métricas rechazan negativos y tipos inválidos. Al cambiar filtros cancela la consulta anterior y limpia datos. 59 pruebas móviles y TypeScript aprobados. APK de reportes en preparación; revisión autenticada pendiente. No operaciones de producción ni integración de la problemática del documento.

2026-10-04: APK de reportes compilado en 2m31s, 48 bibliotecas nativas verificadas y PeriodReportPanel presente en sourcemap. output/nucleo-erp-reportes-periodo.apk SHA256 847D365DABEC6D6E7693FD7C01F7F61A6169163ADE4CF026CECFB9671FD4E2FE. Instalación conservando datos aprobada; arranque COLD Status ok; logcat de ReactNativeJS/AndroidRuntime sin errores. Consulta protegida y revisión visual autenticada aún pendientes; sin exportación móvil CSV en esta entrega.

2026-10-04: Auditoría de operaciones comerciales integrada al mismo commit MongoDB del estado, inventario, caja y comprobante. Evento UPDATE de ventas/compras incluye usuario, empresa/sucursal, estado anterior/nuevo y enlaces a comprobante, movimiento de stock y caja. El reintento idéntico conserva un solo evento. Fallo simulado de almacenamiento de auditoría revierte todos los cambios. Backend build, 292 pruebas generales y 16 integraciones MongoDB local aprobados. Publicado commit dbf9fa0 a master; despliegue Render aún no confirmado. No movimientos de producción. Este cambio no requiere reconstruir APK. ERP integral sigue pendiente y problemática del documento excluida.

2026-10-04: GET /commercial-settlements?kind=sales|purchase-orders&sourceId=<id> permite consultar un comprobante sin reenviar la operación. Exige usuarios.ver, scope de sesión y query estricto; rechaza tenant sobrescrito, campos extra y valores repetidos. Devuelve 404 para comprobante inexistente o fuera de empresa/sucursal. Backend build, 292 pruebas generales existentes, 2 nuevas pruebas HTTP de permisos/query y 16 integraciones MongoDB local aprobados. Falta conectar la consulta a botones web/móvil y confirmar Render. Sin movimientos de producción.

2026-10-04: Clientes web y Android incorporan Ver comprobante en los listados de ventas/compras, disponible para lectura sin exigir permiso de edición. GET protegido por documento; cliente valida empresa/sucursal, origen, IDs de comprobante/almacén/cuenta/stock/caja, estado, cantidad, total y fecha real. Los documentos cambiados manualmente pueden no tener comprobante conjunto y la pantalla lo explica. Actualizar/cerrar, cancelación al desmontar y 401 móvil cierra sesión. 60 pruebas móviles, 35 web, TypeScript móvil y compilación web aprobados. Web compilada local en output/web-comprobantes; no publicada. APK en preparación; revisión autenticada pendiente. No movimientos de producción.

2026-10-04: APK output/nucleo-erp-comprobantes.apk compilado e instalado conservando datos. SHA256 B03E34444999EB018D292AC2A0A6B0E8569F2B8BAFEF986955EAB3C4E0109750. Sourcemap confirma ReceiptView; 48 bibliotecas nativas idénticas al APK de reportes. Gradle inicialmente encontró libc++_shared.so temporal ilegible; restauradas las cuatro arquitecturas desde APK anterior verificado, último build aprobado en 34s. Arranque COLD Status ok. Revisión visual con sesión autenticada pendiente, web no publicada y despliegue de endpoint Render pendiente de confirmar. No operaciones de producción; ERP integral aún en desarrollo.

2026-10-04: Listados comerciales Android conservan ventas/compras y cursores cuando falla la consulta auxiliar de nombres. Los registros muestran identificadores y aviso separado; fallo de la consulta principal mantiene su error y sesión vencida conserva onExpired. Texto de alta comercial actualizado para explicar operación conjunta posterior o movimientos manuales. TypeScript y 60 pruebas móviles existentes aprobados; el comportamiento visual con fallo auxiliar aún requiere revisión autenticada. APK actualizado en preparación. Sin operaciones de producción.
2026-10-04: APK output/nucleo-erp-listados-resilientes.apk aprobado (build 6m22s), sourcemap confirma aviso y 48 bibliotecas nativas idénticas a comprobantes. SHA256 FFD10852761216A2A7ECECDCEA37F7AA81E8ABC2D9C39B46EDE0EBB2E07414C0. ADB tardó en instalar y finalmente confirmó Success; arranque independiente COLD Status ok. El caso visual de fallo de nombres con sesión autenticada sigue pendiente.

2026-10-04: Configuración deja de usar registros demo en memoria. Modelo ModuleConfig persistente en MongoDB con índice único companyId/module; GET /config y /config/:module conservan permiso configuracion.ver y scope de sesión. Lecturas asíncronas manejan errores mediante next; módulo inválido 400 y configuración inexistente 404 sin valores simulados. No se crean ajustes de producción ni se implementa edición de configuración en esta entrega; enabled es un dato almacenado, no cambia automáticamente autorización o rutas. Backend build y 296 pruebas generales aprobados; 17 integraciones MongoDB local verifican además persistencia, unicidad y aislamiento de configuración. ERP integral aún no finalizado; problemática del documento excluida.

2026-10-04: PUT /config/inventario guarda stockAlertThreshold entero 0..1000000 con expectedVersion null para alta o versión entera para actualización. Requiere configuracion.ver y usuarios.editar; empresa/sucursal/usuario de sesión. Índice único y versión detectan guardados simultáneos; conserva otras preferencias y enabled previo. Auditoría en la misma transacción; fallo de auditoría revierte guardado. GET devuelve versión (0 para registros anteriores). Backend build, 297 pruebas generales previas más 2 nuevas pruebas HTTP de permisos, y 19 integraciones MongoDB local aprobados. Es persistencia de preferencia: todavía no conecta avisos ni editor web/móvil; no cambia permisos, impuestos, MFA o disponibilidad de módulos. No ajustes de producción. ERP integral sigue pendiente.

2026-10-04: GET /stock/alerts requiere usuarios.ver y scope de empresa/sucursal. Lee stockAlertThreshold de configuración inventario de la empresa, devuelve configured/threshold/configVersion/items/nextCursor. Sin umbral no inventa un valor; devuelve configured=false. Umbral inválido guardado devuelve 400. Filtra quantity < threshold antes de aplicar cursor/límite, con búsqueda y nombres del contrato de existencias. Solo saldos de combinaciones producto/almacén con movimientos registrados; no crea cero para productos sin movimientos. Backend build, 299 pruebas generales y 20 integraciones MongoDB local aprobados (límite exacto, búsqueda, páginas y aislamiento). Falta editor y vista de avisos web/móvil; no hay notificaciones push ni correo en esta entrega. Render pendiente de confirmar; no operaciones de producción. ERP integral no finalizado.

2026-10-04: Web y Android conectan editor del umbral y avisos de inventario. Consulta/edición del ajuste solo visible con configuracion.ver y guardado además con usuarios.editar. Umbral afecta todas las sucursales de empresa; confirmación explícita. GET/PUT verifica empresa, módulo, versión y umbral confirmado, conserva falta de configuración 404 y rechaza respuestas ajenas. Avisos: búsqueda, cursor de 20 registros, valores estrictamente inferiores al umbral, ausencia de configuración explícita, nombres o IDs y sin unidades inventadas. Consultas canceladas al salir; guardado bloqueado, error exige actualizar antes de reintento, 401 móvil cierra sesión. 62 pruebas móviles y 37 web, tipos móviles y build web aprobados. Artefacto web local output/web-avisos-inventario; no publicado. APK en preparación; revisión visual autenticada pendiente. No operaciones de producción ni integración de problemática del documento.
2026-10-04: APK output/nucleo-erp-avisos-inventario.apk compilado en 3m34s e instalado preservando datos. SHA256 2BF46AA01CEAFC80BFFBBF388CE3BFAB60357E14CDE02DD45EAF0CE276E71B64. Sourcemap confirma InventoryAlerts y stockAlertThreshold, 48 bibliotecas idénticas al APK anterior. Arranque COLD Status ok (6711ms). Revisión autenticada de ajustes y avisos pendiente; web sigue local, Render pendiente de confirmar. No operaciones de producción.

### Caja manual: persistencia y auditoría atómicas (2026-10-04)
El POST de movimientos manuales guarda el movimiento y su auditoría en una sola transacción. Si falla auditoría, se revierte el movimiento; la cuenta se comprueba por empresa, sucursal y estado activo dentro de la transacción. Validación: compilación backend, 300 pruebas generales y 21 integraciones con MongoDB local aislado. No agrega idempotencia de solicitudes manuales ni confirma el despliegue de Render.


### Cuentas bancarias: creación y auditoría atómicas (2026-10-04)
La creación HTTP de cuentas bancarias guarda cuenta y auditoría en una sola transacción. Se comprobó rollback ante falla de auditoría, normalización de identificador, rechazo de duplicados dentro de la sucursal y separación entre sucursales. Validación: compilación backend, 301 pruebas generales y 22 integraciones locales. Despliegue Render pendiente de confirmación.


### Contactos comerciales por sucursal (2026-10-04)
Ventas y compras exigen que el cliente/proveedor esté activo en la empresa y sucursal de la sesión. Producto conserva catálogo de empresa. Pruebas comprueban rechazo de contacto de otra sucursal sin crear documento y aceptación al pertenecer a la sucursal activa. Compilación, 303 pruebas generales y 23 integraciones locales aprobadas. Sin modificación de documentos históricos. Auditoría atómica de creación comercial sigue pendiente; Render no confirmado.


### Creación comercial con auditoría atómica (2026-10-04)
POST de ventas y compras guarda documento y evento CREATE dentro de una sola transacción; validación de contactos y productos utiliza la misma sesión MongoDB. Pruebas reales verifican rollback si falla auditoría y una auditoría por documento confirmado; pruebas HTTP verifican scope de sesión. Build backend, 305 pruebas generales y 24 integraciones locales aprobados. Cambios manuales de estado aún conservan auditoría posterior y necesitan revisión; despliegue Render no confirmado.


### Estados comerciales manuales y auditoría atómica (2026-10-04)
PATCH de estado en ventas/compras aplica estado esperado y auditoría UPDATE en una sola transacción. Fallo de auditoría conserva estado anterior; cambios concurrentes confirman uno y devuelven conflicto al otro. Auditoría identifica cambio manual y estado anterior/nuevo. No genera movimientos de caja o stock: se conserva la operación conjunta separada. Build, 305 pruebas generales y 25 integraciones locales aprobadas. Se corrigió la prueba para comparar stock con el saldo inicial de su fixture. Render pendiente de confirmar.


### Importes comerciales dentro de rango (2026-10-04)
Ventas y compras calculan total con verificación de cantidad mínima 0.000001, precio/costo finito no negativo y centavos enteros seguros; rechazan overflow o pérdida de precisión antes de persistir. Conserva redondeo a dos decimales y documentos con importe cero (operación conjunta de caja continúa requiriendo positivo). No altera documentos históricos. Build, 309 pruebas generales y 26 integraciones locales aprobados; pruebas confirman ausencia de documento/auditoría al rechazar overflow. Render pendiente de confirmar.


### Movimientos manuales de inventario auditados (2026-10-04)
HTTP de entradas, salidas y transferencias usa recordAuditedStock: movimiento y evento CREATE inventario.movimientos se guardan en una transacción, con usuario/empresa/sucursal de sesión y referencia. Error de auditoría revierte movimiento y efectos en saldo; referencia repetida no duplica auditoría. Operación comercial conserva su auditoría propia. Build, 312 pruebas generales y 27 integraciones locales aprobados. El servidor HTTP de pruebas necesitó parser JSON antes de montar stock. Sin movimientos de producción; Render pendiente de confirmar.


### Auditoría con páginas y filtros (2026-10-05)
GET /audit/page añade cursor por ID descendente, límite 1..100 (20 por defecto), filtros exactos de módulo y acción. Requiere auditoria.ver y scope empresa/sucursal de sesión; query estricta rechaza overrides de tenant. Conserva endpoint previo para clientes actuales. Build, 314 pruebas generales y 28 integraciones locales aprobados; paginado real verifica eventos filtrados sin duplicados ni registros de otras empresas/sucursales. Vista web/Android de las páginas nuevas pendiente; Render pendiente de confirmar.


### Vistas paginadas de auditoría (2026-10-05)
Web y Android consultan /audit/page, 20 eventos por página, filtros exactos por módulo/acción, anterior/siguiente y actualizar desde primera página. Validan scope empresa/sucursal, IDs, acción, fecha, orden y cursor antes de mostrar respuesta. Consultas canceladas al salir y 401 Android cierra sesión; permiso auditoria.ver controla acceso. Panel muestra registro y fecha sin exponer datos completos de auditoría. Tipos móvil, pruebas móviles (64), web (39) y build web aprobados. Web local output/web-auditoria-paginada; APK en preparación y revisión autenticada pendiente.


2026-10-05: APK output/nucleo-erp-auditoria-paginada.apk compilada (4m24), sourcemap confirma AuditPanel y /audit/page; 48 bibliotecas nativas idénticas al APK anterior. SHA256 1920764BDD7F13411E657872113A8574216097A1246FF7606EB81D26F1025884. Instalación ADB -r Success y arranque Status ok (12253ms). Revisión autenticada de filtros/páginas sigue pendiente; web local y despliegue Render pendiente de confirmar. ERP integral no finalizado.


### Consulta paginada de empleados (2026-10-05)
GET /employees/page con permiso rrhh.ver, empresa/sucursal de sesión, búsqueda literal por nombre/puesto, estado ACTIVE/INACTIVE, límite 20 por defecto (máximo 50), cursor descendente e índice de empresa/sucursal/ID. Conserva ruta anterior. Build backend, 315 pruebas generales y 29 integraciones locales aprobados; integración verifica páginas y aislamiento por empresa/sucursal. Pantallas de RRHH pendientes; no constituye nómina ni gestión completa de personal. Render pendiente de confirmar.


### Consulta de empleados web y Android (2026-10-05)
Pantallas de consulta con búsqueda nombre/puesto, estado, páginas de 20 y anterior/siguiente/actualizar. Acceso desde navegación web y enlace Empleados móvil con rrhh.ver; validan empresa/sucursal, orden/cursor, estado y datos de empleado. Abort al salir y 401 Android cierra sesión. Tipos móvil, 66 pruebas móviles, 41 web y build web aprobados. Web local output/web-empleados; no publicada. APK en preparación. Altas y edición de personal no conectadas en estas pantallas; revisión autenticada pendiente.


2026-10-05: APK output/nucleo-erp-empleados.apk compilada en 16m7; sourcemap confirma EmployeePanel y /employees/page. 48 bibliotecas nativas idénticas a auditoría. SHA256 3A40EDF5E64A5813790C53444CF67DAE884D33FEB027ADC29202BE611427368B. ADB -r Success y MainActivity Status ok (34340ms). No revisión autenticada de empleados; web local no publicada. ERP sigue en desarrollo.


### Altas de empleados con departamento validado (2026-10-05)
Alta exige usuario activo y departamento activo de empresa/sucursal. Documento empleado y auditoría CREATE se guardan en una transacción; evento identifica actor autenticado y usuario vinculado de forma separada, sin almacenar nombre/puesto en auditoría. Usuario vinculado debe tener ID MongoDB válido en HTTP. Build, 316 pruebas generales y 3 HTTP adicionales aprobados; 30 integraciones locales verifican departamento ajeno/inactivo, rollback de auditoría y duplicados. Runner local amplía launchTimeout de 10s a 60s tras fallo de arranque del host; conserva aislamiento y mismas aserciones. Formulario de alta web/Android todavía pendiente y despliegue Render sin confirmar.



### Alta de empleados con selectores web y Android (2026-10-05)
GET /employees/options/users y /employees/options/departments requieren rrhh.crear, búsqueda literal, páginas con cursor (20 por defecto, máximo 50), scope de empresa/sucursal y solo opciones activas. Usuarios devuelven nombre e identidad sin correo, contraseña, permisos ni rol. Backend compilado; 320 pruebas generales y 31 integraciones MongoDB locales aprobadas. Publicado backend en commit 321a4af; despliegue Render pendiente de confirmar.
Formularios web/móvil permiten nombre, puesto y selección por nombre; confirman antes de POST /employees y comprueban identidad, scope y valores de respuesta. Impiden doble envío y bloquean otra alta si la respuesta es incierta, indicando revisar la lista. Altas confirmadas limpian campos y actualizan consulta. Tipos móvil y build web aprobados; pruebas cliente web/móvil aprobadas, incluyendo scope, opciones inactivas, paginación y confirmaciones inconsistentes. Web local output/web-alta-empleados. APK en preparación; revisión visual autenticada pendiente. No incluye edición de empleados, nómina ni creación de usuarios/departamentos desde este formulario. ERP integral sigue pendiente.

2026-10-05: APK output/nucleo-erp-alta-empleados.apk compilada en 5m19, 612 módulos; sourcemap confirma formulario, API y hook de altas. 48 bibliotecas nativas idénticas al APK de consulta de empleados. SHA256 85E06775710516E003493810AD1AC8A51597DC75F4EA9DA8509F9284A71C9E6B. ADB install -r Success; MainActivity Status ok (10587ms). Revisión autenticada de selector y alta pendiente; no se crearon empleados de producción. Web local preparada; ERP completo aún no finalizado.


### Alta de departamentos auditada (2026-10-05)
POST /departments conserva usuarios.editar y ahora exige cuerpo estricto name/code; rechaza campos de empresa, sucursal y estado. Scope y actor proceden de sesión. Departamento y evento CREATE empresas.departamentos se guardan juntos en transacción MongoDB; validación de sucursal activa se realiza con la misma sesión y un código duplicado devuelve 409 sin añadir auditoría. Helper de creación directo conserva compatibilidad. Build y 320 pruebas generales aprobadas, más 3 pruebas HTTP nuevas y 32 integraciones locales. Integración prueba rollback de auditoría, normalización, duplicados y sucursales ajenas/inactivas. Se corrigió fixture de sucursal con código de más de 32 caracteres, sin cambiar límites del modelo. No modifica clientes ni APK; interfaz de administración de departamentos pendiente. ERP integral no finalizado y Render pendiente de confirmar.


### Formularios de departamentos web y Android (2026-10-05)
Alta de departamentos disponible dentro del formulario de empleados con permiso usuarios.editar (además de rrhh.crear para acceder al formulario). Nombre y código, normalización de código en mayúsculas, confirmación previa, comprobación exacta de scope/estado/valores devueltos, bloqueo de doble envío y resultados ambiguos. Al confirmar creación se selecciona el departamento y se actualiza el selector. No modifica permisos del backend. Tipos móvil y build web aprobados, 44 pruebas web y 69 móviles aprobadas. Web local output/web-departamentos; APK en preparación. Sin escrituras de producción ni revisión autenticada. No equivale a administración completa de departamentos, edición de empleados ni nómina.

APK output/nucleo-erp-departamentos.apk compilada en 2m52, 615 módulos. Sourcemap confirma formulario/API/hook; 48 bibliotecas nativas idénticas al APK de alta de empleados. SHA256 5B6A413D997CAB3FC4C80461A69C1EF6C61450AA5F1CE3B40791AA8EAE4EA233. Revisión autenticada pendiente.
ADB install -r Success; MainActivity Status ok (22540ms). Revisión visual autenticada pendiente; web local no publicada. ERP integral todavía en desarrollo.


### Edición de nombre y puesto de empleados en servidor (2026-10-05)
PATCH /employees/:id requiere rrhh.editar, ID MongoDB válido y cuerpo estricto fullName/position/expected. Compara nombre y puesto originales junto a scope de empresa/sucursal; conflicto 409 evita sobrescribir una edición concurrente. No acepta cambiar usuario, departamento, estado ni tenant. Actualización y auditoría UPDATE rrhh se confirman en una transacción; evento registra campos cambiados sin copiar nombre/puesto. Build, 324 pruebas generales y 33 integraciones locales aprobadas; pruebas reales verifican rollback de auditoría, tenant ajeno, carrera entre dos ediciones y preservación de identidad vinculada. Pantallas de edición pendientes, APK sin cambios; despliegue Render pendiente de confirmar. ERP integral sigue en desarrollo.


### Edición de empleados web y Android (2026-10-05)
Nombre/puesto editables con rrhh.editar desde la lista de empleados. Captura snapshot original al abrir, envía únicamente valores nuevos y expected, confirma antes de PATCH y comprueba scope/identidad/usuario/departamento/estado preservados en respuesta. Bloquea doble envío, conflictos y respuestas inciertas; cerrar edición actualiza listado. Guardado confirmado vuelve a consultar datos del servidor. Tipos móvil y build web aprobados; 45 pruebas web y 70 móviles aprobadas. Web local output/web-edicion-empleados; APK en preparación. No incluye cambio de departamento, usuario ni estado; revisión autenticada y despliegue Render pendientes. ERP integral sigue en desarrollo.

APK output/nucleo-erp-edicion-empleados.apk compilada en 2m22, 618 módulos. Sourcemap confirma formulario/API/hook; 48 bibliotecas nativas idénticas al APK de departamentos. SHA256 EF3C5AFB3B4AD3EE9C35C266E29D23B4544DA1EDA8F995F913F7C13B37090B4F. Revisión autenticada pendiente.
ADB install -r Success y MainActivity Status ok (22921ms); sin errores ReactNativeJS/AndroidRuntime en logs del proceso. Revisión autenticada y publicación web pendientes; ERP integral no finalizado.


### Activación e inactivación de empleados en servidor (2026-10-05)
PATCH /employees/:id/status requiere rrhh.editar, ID válido, status y expectedStatus con cuerpo estricto; valida transición distinta y scope de sesión. Estado y auditoría UPDATE rrhh en transacción. Reactivación requiere usuario y departamento activos de empresa/sucursal; inactivación afecta únicamente registro laboral, no cuenta de acceso. Conserva nombre, puesto y vínculos. Build, 325 pruebas generales y 34 integraciones locales aprobadas: rollback de auditoría, carrera de cambios, vínculos inactivos, scope ajeno y reactivación. Pantallas de cambio de estado pendientes; APK sin cambios. Render pendiente de confirmar y ERP integral en desarrollo.


## 2026-10-05: estado de empleados y publicación web

Activación/desactivación laboral con confirmación, estado esperado y preservación de identidad/vínculos. 53 pruebas web y 78 móviles aprobadas; compilación backend/web y typecheck móvil aprobados. Render público confirmado en docs/web-release-20261005.md. APK output/nucleo-erp-estado-empleados.apk: BUILD SUCCESSFUL en 5m01, 640 módulos, SHA256 0e01dcfc779eb2f761dd7f79e1d5b8329852d9ba558fc5852f218d2a04a51b6e. Sourcemap confirma EmployeeStatus, API y hook, así como demostración y exportaciones. 48 bibliotecas nativas coinciden con APK anterior; código nativo sin cambios. Teléfono conectado R7AX208XJXH aparece unauthorized; no se instaló ni se borraron datos. Acciones autenticadas requieren revisión. ERP integral todavía en desarrollo; problemática del documento excluida.


Actualización de instalación: 2026-10-05, teléfono 45X8MRRGEAJFHQRG autorizado. ADB install -r Success del APK de estado de empleados, arranque COLD Status ok (401ms), proceso activo y sin errores ReactNativeJS/AndroidRuntime en la lectura de arranque. Datos conservados.


## 2026-10-05: bandeja personal de avisos

GET /notifications/page exige notificaciones.ver y deriva empresa, sucursal y destinatario de la sesión. Consulta únicamente IN_APP en estados SENT/READ, con filtros estrictos, cursor por ID descendente y límite 20 por defecto (máximo 50). Índice compuesto de scope/canal/estado/ID. Se conserva GET existente por compatibilidad.

PATCH de lectura valida identificador y solo modifica avisos IN_APP enviados o ya leídos del propietario; es idempotente. No consume EMAIL/PUSH pendientes. Lectura no manda avisos externos.

Web: módulo Avisos visible con permiso. Android: bandeja en Actividad junto a auditoría si tiene permisos. Filtros Todos/No leídos/Leídos, paginación, fecha/contenido y actualización de estado confirmada. Contenido se presenta como texto; clientes rechazan respuestas con scope, contenido, estados u orden incompatibles, evitan doble envío y solicitan refrescar si no confirman lectura.

Validación: build backend y web, typecheck móvil, 332 pruebas backend, 55 web, 80 móviles y 37 integraciones MongoDB locales aprobadas. Prueba real verifica 25 avisos en dos páginas, usuarios/sucursales ajenos excluidos, lectura concurrente idempotente y correo pendiente intacto. No datos ni mensajes de producción. Sin revisión visual autenticada de la bandeja.

Publicación web y APK con avisos pendientes: el usuario pidió avisar al terminar módulos para actualizar conjuntamente. No se declara finalizado el ERP. Próximos pendientes de RRHH: administración de departamentos y cambio de departamento de empleados; revisión conjunta de flujos autenticados al preparar la siguiente versión. Problemática del documento excluida.


## 2026-10-05: reasignación de departamento de empleados

PATCH /employees/:id/department exige rrhh.editar y body estricto departmentId/expectedDepartmentId/expectedStatus. ID de empleado válido; compara departamento y estado originales. Solo acepta un destino activo de empresa y sucursal de sesión, distinto del actual. Actualización y auditoría UPDATE rrhh se confirman juntos en transacción; fallar auditoría revierte asignación. Auditoría guarda departamento anterior/nuevo sin copiar nombre. Preserva usuario, nombre, puesto y estado laboral.

GET /employees/department-options exige rrhh.editar y usa búsqueda literal, cursor y 20 opciones activas por página. No requiere rrhh.crear para editar y no amplía acceso al selector de usuarios del alta.

Formularios web y Android: apertura con snapshot original, selector paginado, selección explícita y confirmación; guardado confirmado cierra el formulario y actualiza empleado. Rechaza confirmaciones con otros vínculos, scope, valores o estado, bloquea doble envío, cancela al desmontar y requiere refrescar ante conflicto o respuesta incierta. Acciones visibles solo con rrhh.editar.

Validación aprobada: build servidor/web y typecheck móvil, 334 pruebas backend, 57 web, 82 móviles y 38 integraciones MongoDB locales. Prueba real: departamentos ajenos/inactivos/no existentes, estado original incorrecto, rollback de auditoría, dos reasignaciones simultáneas con una sola confirmación y un solo evento; vínculos laborales preservados. No cambios de empleados de producción. Revisión visual autenticada pendiente.

Pendiente publicar web/API y compilar/instalar APK junto con la bandeja de avisos, según la solicitud de actualizar al terminar módulos. Administración completa de departamentos pendiente. ERP integral no finalizado; problemática del documento excluida.


## 2026-10-05: administración de departamentos

GET /departments/page exige usuarios.ver, admite búsqueda literal en nombre/código, estado y cursor string por ID descendente; default 20, máximo 50. Rechaza campos de empresa/sucursal del cliente. Nuevo índice empresa/sucursal/ID. Conserva GET legacy.

PATCH /departments/:id exige usuarios.editar y nombre/código/estado junto con expected original estricto. Scope y actor de sesión; compara los tres campos originales. Código normalizado en mayúsculas y unicidad por sucursal. Para activar exige sucursal activa; para desactivar rechaza empleados ACTIVE vinculados. Actualización y auditoría UPDATE empresas.departamentos en una transacción; rollback si falla auditoría. Preserva identidad e historial.

Asignación, alta auditada y reactivación de empleados ahora actualizan un contador interno del departamento activo dentro de su propia transacción. Desactivación y asignación compiten por el mismo documento, evitando write skew. El contador no se expone en respuestas públicas. El helper directo legacy de alta sin transacción no se presenta como garantía atómica; las rutas HTTP usan creación auditada transaccional.

Pantallas web y Android: Departamentos accesible con usuarios.ver; alta y edición con usuarios.editar. Búsqueda, filtro de estado, paginación, captura nombre/código/estado, snapshot original y confirmación. Rechazo de respuestas ajenas o incompatibles, doble envío bloqueado, cierre tras guardado y recarga de lista; conflicto requiere cerrar y actualizar. Alta disponible sin rrhh.crear desde el módulo dedicado. No borra departamentos ni activa empleados automáticamente.

Validación: compilación servidor/web y typecheck móvil aprobados; 337 pruebas backend, 59 web, 84 móviles y 40 integraciones MongoDB locales aprobadas. Pruebas reales: rollback de auditoría, código duplicado, empleados activos, filtros literales y carrera entre desactivación/asignación, con una única operación/auditoría confirmada y sin empleado activo en departamento inactivo. Se corrigieron las sucursales del fixture para incluir ciudad obligatoria. Sin datos de producción modificados. Revisión visual autenticada pendiente.

Publicación API/web y APK pendientes de actualización conjunta solicitada por el usuario. ERP integral todavía no finalizado. Próximo frente: administración de usuarios y revisión de permisos; problemática del documento excluida.

## Usuarios: consulta paginada (2026-10-05)

Se añadió GET /users/page con autorización usuarios.ver, empresa y sucursal obtenidas de la sesión, búsqueda literal por nombre/correo, filtro activo/inactivo y cursor por identificador. Límite predeterminado 20, máximo 50; los parámetros de ámbito enviados por el cliente se rechazan. La proyección explícita excluye contraseñas y tokens de verificación. Se conserva el endpoint anterior para compatibilidad y se añade un índice de ámbito/cursor.

Compilación backend y dos pruebas específicas aprobadas. Esta entrega es la base de consulta del módulo; aún faltan la interfaz de administración y las operaciones de edición de usuarios. No se publicó en Render ni se generó/instaló una APK nueva.

## Directorio de usuarios web y móvil (2026-10-05)

Se conectó el directorio Usuarios en ambas interfaces, visible con usuarios.ver: búsqueda por nombre/correo, estados activo/inactivo, páginas de 20, actualización y consulta de rol/permisos. Usa la ruta real /users/page y verifica ámbito, orden, tamaño, cursor y ausencia de campos de credenciales. Las consultas se cancelan al desmontar/cambiar filtros; móvil conserva el manejo de sesión vencida.

Pasaron compilación web, tipos móviles, 61 pruebas web y 86 móviles; los cuatro contratos nuevos se volvieron a ejecutar tras alinear el prefijo de ruta. La pantalla es de consulta: creación y edición de usuarios siguen pendientes. Validación visual autenticada pendiente. No se publicó en Render ni se instaló una APK nueva.

## Alta de usuarios y auditoría indivisible (2026-10-05)

El POST /users ahora crea cuenta y auditoría en la misma transacción. Si falla la auditoría, la cuenta se revierte. Se conserva el control que impide asignar un rol con permisos superiores a los del actor, la empresa/sucursal de sesión y la normalización del correo. La respuesta y la auditoría no incluyen contraseña ni hash.

Compilación backend y 42 pruebas reales MongoDB local aprobadas: rechazo de permisos superiores, rollback por fallo de auditoría, alta confirmada, hash almacenado, duplicados y una sola auditoría. La interfaz de creación y selección de roles aún está pendiente. Cambios locales; sin publicación ni APK nueva.

## Formulario de alta de usuarios web y móvil (2026-10-05)

Se conectó Nuevo usuario dentro del directorio, únicamente con usuarios.crear. Selecciona roles del catálogo autenticado de empresa, descartando permisos que el actor no posee; el servidor conserva su propia validación. Captura nombre, correo y contraseña inicial (mínimo 12 caracteres, máximo 72 bytes UTF8), solicita confirmación sin mostrar la contraseña y envía solo los campos admitidos por POST /users. Confirma identidad, empresa, sucursal, estado activo, rol y permisos devueltos antes de mostrar éxito y actualizar la lista.

No guarda la contraseña en almacenamiento; limpia el campo tras éxito o error, bloquea doble envío y un resultado incierto exige revisar la lista antes de reintentar. Se cancelan solicitudes al desmontar. La contraseña no aparece en confirmaciones ni mensajes.

Pasaron build web, typecheck móvil, 64 pruebas web y 89 móviles. Los nuevos contratos comprueban roles superiores/ajenos/duplicados, preservación de contraseña, respuestas incompatibles y límite UTF8. No se crearon cuentas en producción, no se publicó en Render ni se instaló APK. Revisión visual autenticada pendiente. Administración de edición/estado de usuarios sigue pendiente.

## Edición auditada del nombre de usuarios (2026-10-05)

Se añadió PATCH /users/:id/name con usuarios.editar, cuerpo estricto name/expectedName y ámbito de sesión. Solo modifica el nombre, con comparación del valor original; un conflicto requiere actualizar. Cambio y auditoría se confirman en una transacción. Conserva correo, rol, permisos, estado, contraseña y datos de verificación. Respuesta con proyección pública, sin credenciales; auditoría registra solo el campo afectado.

Web y móvil incluyen Editar nombre con confirmación, bloqueo de doble envío, cancelación al desmontar y actualización tras confirmar. Los cambios de estado y rol siguen pendientes; esta entrega no los incorpora.

Build backend/web, tipos móviles, 66 pruebas web, 91 móviles y 43 MongoDB local aprobados. Prueba real verifica rollback de auditoría, sucursal ajena, nombre obsoleto, conservación de hash/token y auditoría única. Revisión visual autenticada pendiente. Sin publicación Render ni APK nueva.

## Acceso de usuarios y revocación de sesiones (2026-10-05)

Web y móvil permiten activar/desactivar cuentas y reasignar roles con usuarios.editar. Se conserva empresa, sucursal, correo, contraseña y ficha laboral. No se permite cambiar el acceso propio ni administrar cuentas con permisos superiores a los del actor. El servidor compara estado/rol/permisos originales, confirma cambio y auditoría en una transacción y aumenta una versión privada de sesión. Cada solicitud autenticada comprueba cuenta activa, ámbito y versión vigentes en MongoDB; utiliza los permisos actuales. Un token anterior no vuelve a servir tras reactivar la cuenta. Los tokens anteriores sin versión son compatibles únicamente con cuentas que permanecen en versión cero.

La indisponibilidad de validación de sesión devuelve 503 y no permite continuar; versión revocada/cuenta inactiva devuelve 401. No se enviaron cambios a producción. Pasaron build backend/web, tipos móviles, 343 pruebas backend, 68 web, 93 móviles y 44 integración MongoDB. Una prueba de rol válido tenía permisos insuficientes en su fixture; se corrigió el actor de prueba y la suite completa pasó. La revisión visual autenticada y actualización conjunta siguen pendientes.

## Avance local del 5 de octubre: proyectos, producción y borradores

- Proyectos en web y móvil: listado paginado, selección de clientes de la sucursal, creación y edición con comprobación de la versión original. Cerrar requiere progreso 100. Las escrituras y auditorías comparten transacción.
- Producción en web y móvil: planificación, inicio, cancelación y finalización. Completar registra el producto terminado en un almacén activo mediante la misma transacción que la orden y su auditoría. Los reintentos concurrentes producen una sola entrada. Consumo de materias primas, costos y terminaciones parciales no están incluidos en este flujo.
- Facturación: creación de borradores y auditoría atómicas; cliente activo de la misma sucursal. Listado nuevo por cursor, búsqueda literal de número y máximo 50 filas. Esto no emite comprobantes fiscales ni registra cobros.
- Verificación: 47 pruebas con MongoDB local real aprobadas, incluyendo reversión por fallo de auditoría y rechazo de números duplicados. Web: 74 pruebas; móvil: 99 pruebas, compilación web y tipos móviles aprobados en el avance de producción.
- Estos cambios todavía son locales. Falta revisión visual autenticada y preparar la publicación conjunta de web y APK. No declarar el ERP completo con base únicamente en estas pruebas.

### Facturación: consulta web/móvil y cancelación del borrador

- Nuevas pantallas de consulta en ambas aplicaciones, búsqueda por número, estado y páginas de 20. Validan empresa/sucursal, orden del cursor, fechas e importes calculados antes de mostrarlos.
- API POST /invoices/:id/cancel: solo BORRADOR, motivo obligatorio y comparación de updatedAt. Estado y auditoría se confirman en una sola transacción. No modifica ventas, cobros ni existencias. La acción todavía no está expuesta en estas pantallas de consulta.
- Compilación backend aprobada; 48 pruebas con MongoDB real aprobadas, incluida cancelación simultánea y reversión por fallo de auditoría. Dos pruebas de validación de respuestas web/móvil aprobadas.
- Pendientes de Facturación: creación y cancelación desde los formularios, exportación de borradores y revisión visual autenticada. Sin emisión fiscal. Cambios locales, aún sin publicar en Render ni generar una nueva APK.

### Formularios y exportación de Facturación

- Web y móvil: crear borrador desde un selector paginado de ventas propias no canceladas; número, fecha, vencimiento y tasa explícitos. El subtotal toma el total de la venta, mostrado al seleccionar. La confirmación valida venta, cliente, empresa/sucursal y cálculo antes de cerrar el formulario.
- Cancelación visible solo para BORRADOR con permiso de edición, motivo, confirmación y updatedAt original. Bloqueo de doble envío; errores ambiguos requieren cerrar y consultar antes de reintentar.
- PDF y Excel por documento, importes numéricos y nota de documento interno sin validez fiscal, sin cobros y moneda no informada. Web usa impresión/Guardar como PDF; móvil usa la exportación y compartir existentes.
- Backend y web compilan; tipos móviles aprobados. Ocho pruebas de respuestas/formularios de Facturación aprobadas en web y móvil. Pendiente revisión visual autenticada y guardar/compartir archivos en el teléfono. Estos cambios aún no se han publicado ni empaquetado en APK.

### Nombres en Proyectos y Producción

- Los listados resuelven nombres solo para las referencias de la página: cliente dentro de empresa/sucursal, producto dentro del catálogo de la empresa y almacén dentro de empresa/sucursal. Incluyen referencias inactivas para conservar la lectura del historial. Referencias ajenas o inexistentes no muestran nombres.
- Web y móvil muestran estos nombres, SKU y almacén. Las confirmaciones de producción muestran el nombre del producto; los enlaces internos del movimiento se conservan.
- Backend/web compilan, tipos móviles aprobados, 48 pruebas con MongoDB local y 347 pruebas generales del backend aprobadas. Suite móvil: 103 aprobadas antes de añadir la prueba de nombres; luego 14 pruebas dirigidas de Proyectos/Producción aprobadas en ambas aplicaciones, incluyendo campos de nombre malformados.
- Revisión visual autenticada, generación de nueva APK y publicación conjunta siguen pendientes. No se ha actualizado Render con este avance.

### Exportaciones de Proyectos y Producción

Se añadieron documentos PDF/Excel individuales en web y móvil. Dos pruebas escriben y leen XLSX reales, comprueban metadatos, filas, valores numéricos y escape de HTML. Las compilaciones web y tipos móviles pasaron. La exportación web ahora reporta fallos asíncronos de impresión y detecta ventana de impresión ausente; dos pruebas dirigidas aprobadas. Cierre y pendientes consolidados en docs/erp-cierre.md. Cambios sin publicar.

### CRM: persistencia y consulta

- Las rutas de CRM ya usan MongoDB, empresa y sucursal de la sesión, sin datos demo ni fallback de empresa. El servicio antiguo en memoria solo permanece para compatibilidad de pruebas; no lo usan estas rutas.
- API: creación con cliente activo propio, etapa inicial de calificación, cambios de etapa con timestamp y etapa original. Ganada/perdida son cierres terminales y no crean ventas ni cobros. Creación/actualización y auditoría son atómicas.
- Listado por cursor y búsqueda literal; nombres de clientes se resuelven solo dentro de la sucursal. GET /crm/opportunities devuelve una página acotada, y /page ofrece el cursor explícito.
- Pantallas de consulta y filtros CRM en web y móvil. Formularios de creación y cambio de etapa todavía pendientes; no declarar CRM completo.
- Backend compila; 348 pruebas generales y 49 pruebas MongoDB local aprobadas. Web compila. Cambios locales sin publicar ni empaquetar nueva APK.

### CRM: formularios de creación, etapas y exportación

- Web y móvil permiten crear oportunidades seleccionando un cliente activo de la sucursal mediante búsqueda/paginación. Nombre y monto previsto se validan; máximo dos decimales, moneda no informada.
- Cambio de etapa para oportunidades abiertas, con confirmación. Ganada/perdida son cierres terminales. La escritura envía etapa y timestamp originales; respuestas ambiguas/conflictos requieren consultar antes de reintentar. Bloqueo de doble envío y cancelación de solicitudes al desmontar.
- PDF/Excel individual con cliente, etapa y monto numérico, sin representar venta o cobro.
- Compilación web y tipos móviles aprobados; diez pruebas dirigidas CRM/exportaciones aprobadas. Ajustada la precisión de montos del backend para rechazar incluso fracciones pequeñas de centavo.
- Pendiente revisión visual autenticada de los formularios y guardado/compartir real de exportaciones. Cambios aún locales; no se publicó web ni generó nueva APK.

### Logística: seguimiento persistente de envíos

- Rutas de Logística migradas de memoria a MongoDB. Empresa/sucursal vienen exclusivamente de la sesión; las rutas reales ya no usan datos demo ni fallback de empresa.
- Creación desde una venta propia no cancelada, destino y fecha de calendario válida. Pendiente → En tránsito → Entregado; cancelación desde pendiente o tránsito. Entregado/cancelado son terminales. Estado y auditoría comparten transacción y comparación de estado/timestamp originales.
- Web/móvil: selector de ventas paginado, formulario, filtros por destino/estado, confirmación, bloqueo de doble envío y respuestas verificadas. Errores ambiguos requieren consultar antes de reintentar. PDF/Excel individuales de seguimiento.
- Este flujo no modifica stock, estado de venta ni cobros y no integra seguimiento externo de transportistas. Las consultas acotadas resuelven nombres propios de la sucursal.
- Backend compila; 349 pruebas generales y 50 pruebas con MongoDB local aprobadas. Cuatro pruebas de formularios/respuestas web/móvil aprobadas; compilación web y tipos móviles aprobados antes de la incorporación final de botones de exportación.
- Pendiente revisión visual autenticada y exportación real en el teléfono. Cambios locales; no se publicó en Render ni generó nueva APK.

### Mantenimiento: órdenes persistentes, consulta y exportación

- La API real ahora usa MongoDB y scope de sesión. Creación de órdenes por nombre de equipo, trabajo, fecha real y prioridad; inicio, finalización con resultado obligatorio y cancelación. Comparación de estado/timestamp original y auditoría atómica. Los cierres son terminales.
- /maintenance/summary cuenta órdenes reales por estado de la sucursal. Elimina las cifras de disponibilidad y equipos de ejemplo del endpoint real. El antiguo servicio de ejemplo permanece sin uso de estas rutas para compatibilidad de pruebas.
- Permisos actuales: usuarios.ver para consulta, usuarios.editar para escritura. Web y móvil tienen consulta paginada y exportaciones PDF/Excel individuales. Los formularios de creación/cambio de estado aún faltan.
- Equipo identificado por nombre, sin enlace al catálogo de activos; sin costos ni consumo automático de repuestos.
- Verificación previa: backend compila, 350 pruebas generales y 51 con MongoDB local aprobadas. Corrección pendiente de propiedad de la pantalla web resuelta el 6 de octubre. Web y tipos móviles aprobados; cuatro pruebas de consulta/exportación aprobadas, incluida escritura/lectura de XLSX real.
- Pendiente: formularios, revisión visual autenticada y exportación real en teléfono. Sin publicación en Render ni nueva APK.

### Mantenimiento: formularios de escritura

- Web y móvil permiten crear órdenes con equipo, trabajo, fecha y prioridad, iniciar la ejecución, cancelar y terminar con resultado obligatorio.
- Las acciones comparan estado y timestamp originales, preservan equipo/trabajo/programación y confirman el resultado exacto devuelto. Los formularios bloquean doble envío; ante respuestas ambiguas se requiere cerrar y consultar antes de reintentar.
- Escritura visible con usuarios.editar. Consulta sigue con usuarios.ver. El equipo se identifica por nombre; todavía no hay enlace con catálogo de activos, costos ni consumo de repuestos.
- Pendiente revisión visual autenticada y publicación conjunta. No se han actualizado Render ni APK con este avance.


### Calidad — 6 de octubre de 2026
Inspecciones persistentes por empresa y sucursal en API, web y móvil: objeto, criterios, fecha, prioridad, avance y cierre con resultado aprobado/con observaciones/rechazado y nota obligatoria. Cambios con control de versión y auditoría transaccional; búsqueda literal y paginación; exportación individual PDF/Excel. El resumen cuenta registros reales. Lectura con usuarios.ver y gestión con usuarios.editar.
Verificación: 351 pruebas generales de API, 52 de integración MongoDB aislado y 4 pruebas de acciones de clientes aprobadas; compilación API/web y tipos móvil aprobados en la copia temporal. La carpeta original sigue con dependencias incompletas de exportación. Pendiente revisión visual autenticada y publicación conjunta web/APK. Este flujo no calcula rendimiento, no certifica cumplimiento externo ni bloquea existencias. No se ha publicado ni instalado una APK nueva.


### Activos — 6 de octubre de 2026
Registro real por empresa/sucursal con nombre, código único normalizado, ubicación y estado operativo, mantenimiento, fuera de servicio o retirado. Creación y edición en web/móvil; retiro definitivo, control de versión, auditoría transaccional y búsquedas paginadas. PDF/Excel individual con datos reales. El resumen de API cuenta estados; ya no devuelve porcentajes ficticios. Lectura usuarios.ver y gestión usuarios.editar.
Verificación: API compilada, 352 pruebas generales, 53 de integración MongoDB aislado y 4 de acciones de clientes aprobadas; compilación web y tipos móvil aprobados en copia temporal. Pendientes revisión visual autenticada y actualización conjunta. No incluye depreciación, valor contable, sensores de uso ni enlace automático de órdenes de mantenimiento al activo. Cambios locales, sin publicar ni instalar APK.


### Mesa de ayuda — 6 de octubre de 2026
Tickets persistentes de soporte interno por empresa/sucursal: asunto, descripción, fecha objetivo y prioridad. Web y móvil permiten creación, inicio, cancelación y resolución con nota obligatoria; búsquedas literales paginadas y exportación individual PDF/Excel. Resuelto y cancelado son estados finales. Control de versión y auditoría transaccional, incluida reversión de resolución si falla auditoría. El resumen de API cuenta tickets reales y ya no publica incidentes, MTTR ni cumplimiento SLA ficticios. Lectura usuarios.ver y gestión usuarios.editar.
Verificación: 353 pruebas generales API, 54 de integración MongoDB aislado y 6 de acciones/exportación de clientes aprobadas; compilaciones API/web y tipos móvil aprobados. Pendiente revisión visual autenticada, archivos en teléfono y publicación conjunta. No incluye asignación de agentes, conversación por comentarios, adjuntos ni cálculo/contratación de SLA. Cambios locales, sin publicar ni instalar APK.


### Riesgos — 6 de octubre de 2026
Registro cualitativo por empresa/sucursal: nombre, plan de mitigación, fecha de revisión y nivel bajo/medio/alto. Creación, inicio de mitigación, descarte y cierre con conclusión en API/web/móvil. Estados finales inmutables, control de versión, auditoría transaccional, búsqueda paginada y PDF/Excel individual. El resumen cuenta registros reales; elimina la exposición monetaria y mitigación porcentual de ejemplo. Lectura usuarios.ver y gestión usuarios.editar.
Verificación acumulada: 354 pruebas generales API, 55 de integración MongoDB aislado, 102 pruebas web y 125 móviles aprobadas; compilaciones API/web y tipos móvil aprobados. Incluye reversión de cierre si falla auditoría y una sola finalización ante concurrencia. Pendientes revisión visual autenticada y publicación conjunta. No calcula exposición monetaria, probabilidad estadística ni cumplimiento certificado; tampoco permite editar el plan después de crear este registro básico. Cambios locales, sin nueva publicación ni APK.


### Cumplimiento — 6 de octubre de 2026
Obligaciones internas persistentes por empresa/sucursal: nombre, requisito, fecha límite y prioridad. Creación, inicio de revisión, cancelación y cierre con resultado conforme/con observaciones/no conforme y evidencia escrita obligatoria en API/web/móvil. Estados finales protegidos, control de versión, auditoría transaccional, búsqueda paginada y exportación individual PDF/Excel. El resumen cuenta obligaciones reales y elimina porcentajes de cobertura de ejemplo. Lectura usuarios.ver y gestión usuarios.editar.
Verificación: 355 pruebas generales API, 56 de integración MongoDB aislado y 10 pruebas dirigidas de Cumplimiento/Calidad aprobadas; compilaciones API/web y tipos móvil aprobados. Comprobadas reversión de cierre ante auditoría fallida, aislamiento por sucursal y cierre único concurrente. También corregido el guardado desde estados finales en los clientes de Calidad. Pendientes revisión visual autenticada, archivos reales y publicación conjunta. La evidencia es texto, sin adjuntos; no incluye reglas regulatorias, calendarios recurrentes ni certificación/dictamen legal. Cambios locales, sin publicar web/API ni instalar nueva APK.


### Roles — 6 de octubre de 2026
Consulta de roles asignables y creación de roles de empresa en web/móvil, con selección explícita de permisos actuales del actor y exportación individual PDF/Excel. Los roles de empresa se comparten entre sus sucursales; los de sistema se consultan. El alta y auditoría ahora forman una transacción, para evitar un rol creado cuando falla auditoría. Alta no cambia automáticamente permisos de usuarios existentes; la asignación se hace desde Usuarios.
Verificación: 355 pruebas generales API, 57 de integración MongoDB aislado y 6 pruebas dirigidas de clientes/documentos aprobadas; compilaciones API/web y tipos móvil aprobados. Probados límites de empresa, prohibición de permisos elevados, nombres reservados y alta concurrente sin duplicación. Lectura usuarios.ver y creación usuarios.editar. Pendiente edición/desactivación de roles existentes, paginación del catálogo de roles, revisión visual y publicación conjunta. La pantalla filtra localmente la lista cargada; no representa un catálogo paginado del servidor. Cambios locales, sin publicar ni nueva APK.


### Edición de roles — 6 de octubre de 2026
Edición de descripción y permisos de roles de empresa en API/web/móvil. Nombre inmutable y roles de sistema protegidos; no se permite editar el rol del propio actor ni uno con permisos superiores. Control de versión y rechazo de cambios vacíos. Rol, permisos de todos sus usuarios de la empresa (incluidas otras sucursales), incremento de sessionVersion y auditoría se guardan en una transacción. Las sesiones anteriores se revocan. La confirmación de interfaz advierte ese alcance.
La asignación de roles al crear usuarios o cambiar su acceso ahora bloquea el documento del rol dentro de la transacción para evitar copiar permisos antiguos mientras se edita. Verificación: 355 pruebas generales API, 59 de integración MongoDB aislado y 12 pruebas dirigidas de roles/acceso de clientes aprobadas; compilaciones API/web y tipos móvil aprobados. Incluye reversión ante fallo de auditoría, protección del propio rol, dos ediciones concurrentes con un solo resultado y carrera entre alta de usuario y edición de rol. Pendientes desactivación de roles, paginación del catálogo, revisión visual autenticada y actualización conjunta. Cambios locales sin publicar ni nueva APK.
## Actualización del 6 de octubre: administración

La APK 1.0.1 del commit 95c4aee se instaló y abrió en Pixel 7 con API conectada. Los cambios nuevos de estado/paginación de roles y administración de empresa/sucursales son posteriores y todavía locales. Verificados con 355 pruebas de API, 65 de integración MongoDB aislado, 251 de clientes y tipos móviles aprobados. Falta revisión autenticada y nueva entrega conjunta. Empresa/sucursales incluye PDF/Excel administrativos; no cambia la sucursal activa ni constituye validación fiscal.
