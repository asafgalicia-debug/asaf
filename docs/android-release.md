# APK Android release

Desde la raiz del proyecto, en Windows:

```powershell
npm.cmd install
npm.cmd run android:release
```

El comando compila `apps/mobile/android` y muestra la ruta del APK:

`apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

El JavaScript y las imagenes se incluyen en el APK; no requiere Expo Go ni
un servidor Metro para abrir la interfaz.

## Dependencias locales

- Node.js y las dependencias instaladas con npm desde la raiz.
- JDK 17 o 21. El comando busca JAVA_HOME, los JDK en `%USERPROFILE%\.jdks`
  y el Java incluido con Android Studio. Descarta versiones incompatibles.
- Android SDK configurado en `apps/mobile/android/local.properties` o
  mediante ANDROID_HOME. La configuracion actual compila con SDK 35,
  Build Tools 35.0.0 y NDK 26.1.10909125.
- Acceso a Internet para las dependencias que Gradle todavia no tenga en cache.

Los comandos `npm.cmd run android` e `npm.cmd run dev:mobile` tambien apuntan
a `apps/mobile`. La carpeta `android` de la raiz no se usa en este flujo.

## Si Metro no encuentra archivos que existen

En esta maquina, OneDrive presentaba subcarpetas de `node_modules` como
enlaces al enumerarlas. Metro no recorria esas carpetas. La reinstalacion
desde el lockfile restauro las carpetas locales:

```powershell
npm.cmd ci --ignore-scripts --no-audit --no-fund
npm.cmd run android:release
```

Este comando reemplaza las dependencias instaladas, no el codigo fuente.
Para evitar que la sincronizacion vuelva a afectar las dependencias, conviene
trabajar con una copia del repositorio fuera de OneDrive.

## Alcance de esta entrega

La variante es release, pero usa el certificado de desarrollo configurado
actualmente en Gradle. Sirve para instalar y probar la aplicacion. Para publicar
en Google Play se necesita configurar una clave de firma propia, generar el
Android App Bundle y revisar los requisitos vigentes de la tienda.

Los modulos implementados de la interfaz movil se conectan a la API configurada
en EXPO_PUBLIC_API_URL durante la compilacion. La demostracion de 2,000 productos
se mantiene separada de los datos de la empresa.

Si Android Studio muestra "El proveedor de archivos de nube no se esta ejecutando",
abra el proyecto Android de una copia local fuera de OneDrive. En esta maquina
la copia de compilacion es
`C:\Users\asafg\AppData\Local\Temp\nucleo-erp-selectores-20261003\apps\mobile\android`.
No es necesario borrar el proyecto original ni los datos de la aplicacion.
