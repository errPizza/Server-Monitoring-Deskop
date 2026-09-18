# AGM Server Monitoring · Desktop

Aplicación de PC basada en [RPiAppServerMonitoreo](https://github.com/errPizza/RPiAppServerMonitoreo), revisión `4b53cb173931ec4e71290aaf1eff162e84a78a9a`. Conserva el cliente de monitoreo y la identidad visual originales, con Electron, menú lateral y ventana redimensionable. Monitorea tu servidor remoto/Raspberry Pi; no recopila métricas del PC donde la ejecutas.

## Ejecutar

Requiere Node.js 22 o superior y un entorno gráfico de escritorio.

```bash
npm ci
npm start
```

Inicia en **demostración**, con datos y archivos simulados, sin contactar al servidor. Incluye Dashboard, Raspberry Pi, almacenamiento y vista previa de archivos, Docker, Nginx, requests, logs, errores, estadísticas, alertas y control remoto. Actualiza cada 30 segundos; puedes desactivarlo en Ajustes o actualizar manualmente.

## Conectar con tu servidor

En PowerShell, antes de iniciar:

```powershell
$env:AGM_MODE="production"
$env:AGM_API_URL="https://www.anothergamemore.online/api"
npm start
```

En Linux/macOS:

```bash
AGM_MODE=production AGM_API_URL=https://www.anothergamemore.online/api npm start
```

Las mismas variables funcionan al ejecutar el programa instalado. El cliente mantiene el contrato `/api/mobile/*`: login, aprobación administrativa del dispositivo, renovación de tokens y revocación al cerrar sesión. El nombre del dispositivo identifica el sistema de escritorio. El servidor debe admitir `win32`, `linux` o `darwin` en el campo `platform` si aplica una lista de valores permitidos.

Los tokens se guardan cifrados mediante Electron `safeStorage` en el directorio de datos del usuario. En Linux se requiere un llavero compatible; no se permite guardar tokens con el backend de texto plano. La contraseña no se persiste. El proceso principal limita las peticiones a la API configurada y no acepta redirecciones. Los comandos remotos muestran una confirmación nativa.

El backend de desarrollo heredado no sustituye a la API autenticada de producción. Consulta [STORAGE.md](STORAGE.md) para habilitar almacenamiento en el servidor real. No se ha modificado ni desplegado tu servidor.

## Instaladores

Ejecuta en el sistema correspondiente:

```bash
npm run dist:win     # Windows: instalador NSIS .exe
npm run dist:linux   # Linux: AppImage
npm run dist:mac     # macOS: .dmg
```

Los archivos se generan en `release/`. `npm run pack` prepara una carpeta ejecutable. La firma de Windows y la firma/notarización de macOS requieren tus certificados; no están configuradas.

## Desarrollo y validación

```bash
npm run typecheck
npm test
npm run build:web
npm run web
```

La vista web permite revisar la interfaz. Usa sesión en memoria y no tiene el almacenamiento cifrado de Electron; para producción utiliza la aplicación instalada. `EXPO_PUBLIC_APP_ENV` y `EXPO_PUBLIC_API_BASE_URL` configuran únicamente esa vista web.

- `App.tsx`: estructura de escritorio y navegación lateral.
- `desktop/`: ventana, protocolo de recursos, IPC, diálogos y almacenamiento cifrado.
- `src/`: pantallas, componentes, modelos y adaptadores del proyecto original.
- `tests/`: contrato de autenticación, arranque, almacenamiento, animaciones y restricciones de transporte de escritorio.

Las notificaciones del sistema aún no están implementadas; las alertas se consultan dentro de la app. La cobertura de métricas depende de lo que entregue la API original. No se ha validado una sesión contra tu servidor real ni la instalación en Windows/macOS desde este entorno Linux.
