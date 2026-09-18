# Storage y navegación

La app usa un menú superior con cuatro secciones desplegables: General, Servidor, Actividad y Administración. Storage está dentro de Servidor. Se eliminó la barra inferior y la reserva fija de 112 px; el contenido llega al borde inferior con el margen mínimo del dispositivo. El fondo es negro/gris carbón y los colores de estado se conservan.

Android oculta la barra de notificaciones y la de navegación; un gesto desde el borde permite recuperar los controles del sistema. La configuración nativa utiliza el plugin de `expo-navigation-bar` compatible con Expo 52, además de las opciones del stack. Requiere un nuevo APK para aplicar la configuración nativa. El fondo ocupa toda la pantalla; los botones respetan los recortes físicos y el indicador de inicio de iOS.

## Explorador

- Discos físicos separados, con sus particiones/volúmenes, punto de montaje y sistema de archivos.
- Capacidad del disco y de cada volumen; espacio usado y disponible calculado mediante `statfs` en el servidor. El espacio reservado por el sistema de archivos puede hacer que usado + disponible sea menor que el total.
- Carpetas, subida al directorio padre, retorno a los discos y paginación de 200 entradas.
- Vista previa de texto UTF-8 (hasta 256 KiB) e imágenes PNG/JPEG/WebP (hasta 2 MiB). Los demás archivos muestran sus metadatos y explican por qué no tienen vista previa. No hay edición, borrado ni descarga de binarios en esta versión.
- Estados de carga, error/reintento, carpeta vacía, permiso denegado y volumen sin montar.
- El bypass mantiene todos los datos y archivos simulados, identificados en pantalla. No hace llamadas a la RPi.

## Integración con el servidor real

Se preparó el cambio sobre `errPizza/Discord-RobloxPurchsAlerts`, commit `ac3310bb4a091325956e98f6c36fbf28c15de79b`. La copia de trabajo está en `/tmp/agm-storage-backend`; el cambio persistente está en [integrations/agm-storage-backend.patch](integrations/agm-storage-backend.patch). No se ha subido a GitHub ni desplegado en la RPi.

Desde una copia de ese repositorio, revisa y aplica el parche:

```bash
git apply --check /ruta/a/RPiAppServerMonitoreo/integrations/agm-storage-backend.patch
git apply /ruta/a/RPiAppServerMonitoreo/integrations/agm-storage-backend.patch
```

La API añade:

| Método | Ruta | Parámetros |
| --- | --- | --- |
| GET | `/api/mobile/storage/disks` | — |
| GET | `/api/mobile/storage/directory` | `volume`, `path` relativa, `offset` |
| GET | `/api/mobile/storage/file` | `volume`, `path` relativa |

Estas rutas usan los tokens móviles existentes, sesión aprobada, permiso `STORAGE_READ` para admin/owner, límite de peticiones y auditoría. Las peticiones no llevan claves nuevas en la app. También se corrigió el cuerpo JSON de login/refresh del cliente para coincidir con el parser Fastify del servidor.

En el `.env` **del servidor**, configura únicamente puntos de montaje que desees explorar. Por ejemplo, para los volúmenes ya presentes en su Docker Compose:

```dotenv
STORAGE_ROOTS=["/app/data","/app/backups"]
```

Con `STORAGE_ROOTS=[]` se listan los discos, pero no se abren sus archivos. Para otros discos, hay que montarlos y hacerlos visibles al proceso o contenedor, preferentemente con un bind de solo lectura, y añadir el punto de montaje que ve la API. La imagen Docker del parche instala `util-linux` para disponer de `lsblk`. No requiere acceso privilegiado ni ejecutar la app como root; el usuario del servidor necesita permiso de lectura en las rutas compartidas.

La API enumera los dispositivos visibles en su entorno Linux. Un contenedor solo puede explorar los volúmenes que se le hayan montado. Un disco desconectado o inaccesible no se sustituye por datos simulados. Los enlaces simbólicos y el salto a otro dispositivo desde una subcarpeta están bloqueados; cada volumen se abre desde su propia entrada.

Para datos reales, desactiva `EXPO_PUBLIC_BYPASS_AUTH` en el perfil con el que recompiles la app y usa `EXPO_PUBLIC_APP_ENV=production`. La RPi debe estar encendida y ejecutar el backend actualizado.

`backend/storage.js` y las rutas del servidor de desarrollo de este repositorio permiten probar el contrato localmente. Ese servidor de desarrollo requiere `MONITOR_API_KEY` para Storage y usa `MONITOR_STORAGE_ROOTS`; no sustituye la autenticación del backend real.

## Validación

- App: `npm test`, `npm run typecheck` y exportación Android de Expo.
- Navegador a 320/390 px: menú, todas las secciones, carpetas, vista previa y carpeta vacía; cero peticiones a la RPi durante el bypass.
- Backend: pruebas de dispositivos independientes, tamaños reales, paginación, previews limitadas, traversal y symlinks.
- Integración Fastify/SQLite: sesión aprobada, permisos por rol, sesión revocada, auditoría y rechazo de escritura.

Las comprobaciones visuales son de navegador. La ocultación de las barras del sistema debe comprobarse en el APK instalado; la exportación no sustituye esa prueba nativa.
