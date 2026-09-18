const { app, BrowserWindow, protocol, net, ipcMain, safeStorage, dialog, Menu } = require('electron');
const fs = require('node:fs/promises');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { apiUrl, assetPath } = require('./policy.cjs');

protocol.registerSchemesAsPrivileged([{ scheme: 'agm', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);

let window;
const base = (process.env.AGM_API_URL || 'https://www.anothergamemore.online/api').replace(/\/$/, '');
const config = { mode: process.env.AGM_MODE === 'production' ? 'production' : 'mock', apiBaseUrl: base, platform: process.platform };
const keys = new Set(['pi-command-center.access-token', 'pi-command-center.refresh-token', 'pi-command-center.device-id']);

function trusted(event) {

  if (!window || event.sender !== window.webContents || event.senderFrame !== window.webContents.mainFrame || !event.senderFrame.url.startsWith('agm://app/')) throw new Error('Origen no permitido');

}

function register(channel, handler) { ipcMain.handle(channel, (event, ...args) => { trusted(event); return handler(...args); }); }

app.whenReady().then(() => {

  protocol.handle('agm', request => {

    const url = new URL(request.url);

    if (url.host !== 'app') return new Response('Forbidden', { status: 403 });
    try { return net.fetch(pathToFileURL(assetPath(path.join(__dirname, '../dist'), url.pathname)).href); }
    catch { return new Response('Not found', { status: 404 }); }

  });

  ipcMain.on('desktop:config', event => { trusted(event); event.returnValue = config; });

  register('desktop:store', async (action, key, value) => {

    if (!keys.has(key)) throw new Error('Clave no permitida');

    const file = path.join(app.getPath('userData'), key + '.enc');

    if (action === 'delete') { await fs.rm(file, { force: true }); return; }
    if (!safeStorage.isEncryptionAvailable() || (process.platform === 'linux' && safeStorage.getSelectedStorageBackend() === 'basic_text')) throw new Error('Configura un llavero seguro del sistema para iniciar sesión.');
    if (action === 'get') { try { return safeStorage.decryptString(await fs.readFile(file)); }  catch (error) { if (error.code === 'ENOENT') return null; throw error; }}
    if (action !== 'set' || typeof value !== 'string' || value.length > 32768) throw new Error('Valor no válido');
   
    await fs.mkdir(app.getPath('userData'), { recursive: true });
    await fs.writeFile(file + '.tmp', safeStorage.encryptString(value), { mode: 0o600 });
    await fs.rename(file + '.tmp', file);

  });

  register('desktop:request', async (url, options = {}) => {

    const target = apiUrl(base, url);

    if (!['GET', 'POST'].includes(options.method || 'GET')) throw new Error('Método no permitido');

    const headers = {};

    for (const [key, value] of Object.entries(options.headers || {})) {
      if (['accept', 'content-type', 'authorization'].includes(key.toLowerCase()) && typeof value === 'string') headers[key] = value;
    }

    const response = await net.fetch(target, { method: options.method || 'GET', headers, body: options.body, redirect: 'error', signal: AbortSignal.timeout(10000) });

    return { status: response.status, body: await response.text() };
  });

  register('desktop:dialog', async (title, message, buttons) => {

    const result = await dialog.showMessageBox(window, { type: buttons.length > 1 ? 'warning' : 'info', title: String(title), message: String(message || title), buttons, cancelId: 0, defaultId: 0, noLink: true });
   
    return result.response;
  });

  function createWindow() {

    window = new BrowserWindow({ width: 1440, height: 940, minWidth: 960, minHeight: 640, backgroundColor: '#101010', title: 'AGM Server Monitoring', webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, nodeIntegration: false, sandbox: true } });
    window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    window.webContents.on('will-navigate', event => event.preventDefault());
    window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    window.webContents.session.webRequest.onHeadersReceived((details, callback) => callback({ responseHeaders: { ...details.responseHeaders, 'Content-Security-Policy': ["default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-src 'none'"] } }));
    window.loadURL('agm://app/');

  }

  Menu.setApplicationMenu(Menu.buildFromTemplate([{ label: 'Aplicación', submenu: [{ role: 'quit' }] }, { label: 'Editar', submenu: [{ role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] }, { label: 'Ver', submenu: [{ role: 'reload' }, { role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'togglefullscreen' }] }]));
  createWindow();
  app.on('activate', () => { if (!BrowserWindow.getAllWindows().length) createWindow(); });

});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });