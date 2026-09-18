'use strict';
const fs = require('node:fs/promises');
const { constants } = require('node:fs');
const path = require('node:path');
const { execFile } = require('node:child_process');
const { promisify } = require('node:util');
const { createHash } = require('node:crypto');
const exec = promisify(execFile);
const fail = (status, message) => Object.assign(new Error(message), { status });
const id = value => createHash('sha256').update(value).digest('hex').slice(0, 24);
const PAGE_SIZE = 200;
const TEXT_LIMIT = 256 * 1024;
const IMAGE_LIMIT = 2 * 1024 * 1024;

async function readDevices() {
  if (process.platform !== 'linux') throw fail(501, 'Storage requiere un servidor Linux.');
  const { stdout } = await exec('lsblk', ['--json', '--bytes', '--output', 'NAME,TYPE,SIZE,FSTYPE,LABEL,MODEL,MOUNTPOINTS'], { timeout: 5000, maxBuffer: 2 * 1024 * 1024 });
  return JSON.parse(stdout).blockdevices;
}
function relativeParts(value) {
  if (typeof value !== 'string' || value.length > 4096 || value.includes('\0') || value.includes('\\') || path.isAbsolute(value)) throw fail(400, 'Ruta no válida.');
  const parts = value ? value.split('/') : [];
  if (parts.some(part => !part || part === '.' || part === '..')) throw fail(400, 'Ruta no válida.');
  return parts;
}

// Open each component relative to an anchored directory descriptor. No symlink
// traversal, shell interpolation, or escapes into a different mounted device.
async function withEntry(root, relative, directory, operation) {
  const parts = relativeParts(relative);
  let handle;
  try {
    handle = await fs.open(root, constants.O_RDONLY | constants.O_DIRECTORY | constants.O_NOFOLLOW);
    const rootDevice = (await handle.stat()).dev;
    for (let i = 0; i < parts.length; i++) {
      const flags = constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK | (i < parts.length - 1 || directory ? constants.O_DIRECTORY : 0);
      const next = await fs.open(`/proc/self/fd/${handle.fd}/${parts[i]}`, flags);
      await handle.close(); handle = next;
      if ((await handle.stat()).dev !== rootDevice) throw fail(403, 'Abre este volumen desde su propia entrada en Storage.');
    }
    const stat = await handle.stat();
    if (directory ? !stat.isDirectory() : !stat.isFile()) throw fail(400, directory ? 'La ruta no es una carpeta.' : 'Solo se pueden abrir archivos regulares.');
    return await operation(handle, stat);
  } finally { if (handle) await handle.close(); }
}

function createStorageService({ roots = [], devices = readDevices } = {}) {
  if (!Array.isArray(roots) || roots.some(root => typeof root !== 'string' || !path.isAbsolute(root))) throw new Error('La lista de raíces de Storage debe ser un array JSON de puntos de montaje absolutos.');
  const allowed = new Set(roots.map(root => path.resolve(root)));
  async function inventory() {
    const disks = [];
    const locations = new Map();
    const blockdevices = await devices();
    for (const disk of blockdevices.filter(device => device.type === 'disk')) {
      const volumes = [];
      const visited = new Set();
      async function walk(device) {
        const mounts = (Array.isArray(device.mountpoints) ? device.mountpoints : [device.mountpoint]).filter(mount => typeof mount === 'string' && mount.startsWith('/'));
        if (mounts.length || (!device.children?.length && device.type !== 'disk') || (!device.children?.length && device.fstype)) {
          for (const mount of mounts.length ? mounts : [null]) {
            const volumeId = id(`${device.name}:${mount ?? ''}`);
            if (visited.has(volumeId)) continue;
            visited.add(volumeId);
            let totalBytes = Number(device.size) || 0, usedBytes = null, freeBytes = null;
            let reason = mount ? 'Exploración no habilitada para este volumen.' : 'Volumen sin montar.';
            let browsable = false;
            if (mount) {
              try {
                const stats = await fs.statfs(mount);
                totalBytes = stats.blocks * stats.bsize;
                usedBytes = (stats.blocks - stats.bfree) * stats.bsize;
                freeBytes = stats.bavail * stats.bsize;
                // Do not allow a configured symlink to change the browsing root.
                browsable = allowed.has(path.resolve(mount)) && await fs.realpath(mount) === path.resolve(mount);
                if (browsable) locations.set(volumeId, mount);
              } catch { reason = 'No se pudo consultar el volumen; comprueba que siga montado y sus permisos.'; }
            }
            volumes.push({ id: volumeId, name: device.label || device.name, mountPoint: mount, filesystem: device.fstype || null, totalBytes, usedBytes, freeBytes, browsable, ...(browsable ? {} : { unavailableReason: reason }) });
          }
        }
        for (const child of device.children || []) await walk(child);
      }
      await walk(disk);
      disks.push({ id: id(disk.name), name: disk.model?.trim() || disk.name, device: `/dev/${disk.name}`, model: disk.model?.trim() || '', sizeBytes: Number(disk.size) || 0, volumes });
    }
    return { disks, locations };
  }
  async function volumeRoot(volume) {
    const { locations } = await inventory();
    const root = locations.get(volume);
    if (!root) throw fail(403, 'Volumen no autorizado o ya no está montado.');
    return root;
  }
  return {
    async disks() { return (await inventory()).disks; },
    async directory(volume, relative = '', offset = 0) {
      relativeParts(relative);
      if (!Number.isSafeInteger(offset) || offset < 0) throw fail(400, 'Paginación no válida.');
      const root = await volumeRoot(volume);
      return withEntry(root, relative, true, async handle => {
        const children = (await fs.readdir(`/proc/self/fd/${handle.fd}`, { withFileTypes: true })).sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()) || a.name.localeCompare(b.name));
        const entries = [];
        for (const child of children.slice(offset, offset + PAGE_SIZE)) {
          try {
            const stats = await fs.lstat(`/proc/self/fd/${handle.fd}/${child.name}`);
            entries.push({ name: child.name, path: [relative, child.name].filter(Boolean).join('/'), kind: stats.isSymbolicLink() ? 'symlink' : stats.isDirectory() ? 'directory' : stats.isFile() ? 'file' : 'other', sizeBytes: stats.isFile() ? stats.size : null, modifiedAt: stats.mtime.toISOString() });
          } catch (error) { if (error.code !== 'ENOENT' && error.code !== 'EACCES') throw error; }
        }
        return { path: relative, entries, nextOffset: children.length > offset + PAGE_SIZE ? offset + PAGE_SIZE : null };
      });
    },
    async file(volume, relative) {
      relativeParts(relative);
      const root = await volumeRoot(volume);
      return withEntry(root, relative, false, async (handle, stat) => {
        const metadata = { name: path.basename(relative), sizeBytes: stat.size, modifiedAt: stat.mtime.toISOString() };
        const buffer = Buffer.alloc(Math.min(stat.size, IMAGE_LIMIT) + 1);
        const { bytesRead } = await handle.read(buffer, 0, buffer.length, 0);
        const data = buffer.subarray(0, bytesRead);
        const mimeType = data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10])) ? 'image/png' : data[0] === 255 && data[1] === 216 && data[2] === 255 ? 'image/jpeg' : data.subarray(0, 4).toString() === 'RIFF' && data.subarray(8, 12).toString() === 'WEBP' ? 'image/webp' : null;
        if (mimeType && stat.size <= IMAGE_LIMIT && bytesRead <= IMAGE_LIMIT) return { ...metadata, kind: 'image', mimeType, content: data.toString('base64') };
        if (mimeType) return { ...metadata, kind: 'unsupported', message: 'La imagen supera el límite de vista previa de 2 MiB.' };
        const sample = data.subarray(0, TEXT_LIMIT);
        if (sample.includes(0)) return { ...metadata, kind: 'unsupported', message: 'Archivo binario: vista previa no disponible.' };
        try {
          const truncated = stat.size > TEXT_LIMIT;
          const content = new TextDecoder('utf-8', { fatal: true }).decode(sample, { stream: truncated });
          return { ...metadata, kind: 'text', content, truncated };
        } catch { return { ...metadata, kind: 'unsupported', message: 'Este archivo no es texto UTF-8 ni una imagen compatible.' }; }
      });
    },
  };
}
function storageError(error) {
  if (error.status) return { status: error.status, error: error.message };
  if (['EACCES', 'EPERM', 'ELOOP'].includes(error.code)) return { status: 403, error: 'No hay permiso para abrir esta ruta o es un enlace simbólico.' };
  if (['ENOENT', 'ENOTDIR', 'ENODEV'].includes(error.code)) return { status: 404, error: 'La ruta o el disco ya no están disponibles.' };
  return { status: 503, error: 'No se pudo consultar Storage en el servidor.' };
}
module.exports = { createStorageService, storageError };
