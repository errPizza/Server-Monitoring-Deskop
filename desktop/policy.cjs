const path = require('node:path');

function apiUrl(base, input) {

  const root = new URL(base);
  const url = new URL(input);

  if (!['https:', 'http:'].includes(root.protocol) || root.username || root.password || root.search || root.hash) throw new Error('URL de API inválida');
  if (url.origin !== root.origin || !url.pathname.startsWith(root.pathname.replace(/\/$/, '') + '/mobile/') || url.username || url.password) throw new Error('Destino no permitido');
 
  return url.href;
}

function assetPath(root, pathname) {

  const file = path.resolve(root, '.' + decodeURIComponent(pathname === '/' ? '/index.html' : pathname));

  if (!file.startsWith(path.resolve(root) + path.sep)) throw new Error('Ruta no permitida');

  return file;
}

module.exports = { apiUrl, assetPath };