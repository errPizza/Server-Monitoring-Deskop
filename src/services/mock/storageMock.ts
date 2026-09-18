import { StorageDirectory, StorageDisk, StorageFile } from '../../models/storage';
const GiB = 1024 ** 3;
export const storageDisksMock: StorageDisk[] = [
  { id: 'mmcblk0', name: 'Sistema · microSD', device: '/dev/mmcblk0', model: 'SD · ejemplo', sizeBytes: 64 * GiB, volumes: [
    { id: 'system', name: 'Sistema', mountPoint: '/', filesystem: 'ext4', totalBytes: 64 * GiB, usedBytes: 39.7 * GiB, freeBytes: 24.3 * GiB, browsable: true },
  ] },
  { id: 'sda', name: 'Archivos · SSD', device: '/dev/sda', model: 'SSD USB · ejemplo', sizeBytes: 512 * GiB, volumes: [
    { id: 'data', name: 'Datos', mountPoint: '/mnt/data', filesystem: 'ext4', totalBytes: 476.9 * GiB, usedBytes: 184.2 * GiB, freeBytes: 292.7 * GiB, browsable: true },
  ] },
  { id: 'sdb', name: 'Backup · USB', device: '/dev/sdb', model: 'USB · ejemplo', sizeBytes: 128 * GiB, volumes: [
    { id: 'backup', name: 'Backup', mountPoint: null, filesystem: 'exfat', totalBytes: 119.2 * GiB, usedBytes: null, freeBytes: null, browsable: false, unavailableReason: 'Volumen sin montar' },
  ] },
];
const files: Record<string, Record<string, string | null>> = {
  system: { 'home': null, 'home/pi': null, 'home/pi/README.txt': 'Raspberry Pi · datos de ejemplo\n\nEste explorador usa archivos simulados mientras está activo el bypass.\n', 'var': null, 'var/log': null, 'var/log/app.log': '[INFO] Ejemplo de registro de la aplicación.\n', 'etc': null, 'etc/hostname': 'rpi-agm-demo\n' },
  data: { 'Documentos': null, 'Documentos/notas.txt': 'Another Game More Studio\n\nDocumentos de ejemplo para explorar Storage.\n', 'Backups': null, 'Backups/backup.tar.gz': '\u0000BINARIO', 'Proyectos': null, 'Proyectos/config.json': '{\n  "name": "AGM",\n  "demo": true\n}\n', 'Vacía': null, 'LEEME.txt': 'Disco de datos simulado.\nAbre una carpeta para explorar sus archivos.\n' },
};
const modifiedAt = '2026-09-13T00:00:00.000Z';
export const mockStorage = {
  async getStorageDisks() { return storageDisksMock; },
  async getStorageDirectory(volume: string, path: string, offset = 0): Promise<StorageDirectory> {
    const data = files[volume];
    if (!data || (path && data[path] !== null)) throw new Error('Carpeta no disponible.');
    const prefix = path ? `${path}/` : '';
    const entries = Object.entries(data).filter(([key]) => key.startsWith(prefix) && !key.slice(prefix.length).includes('/')).map(([key, content]) => ({ name: key.slice(prefix.length), path: key, kind: content === null ? 'directory' as const : 'file' as const, sizeBytes: content === null ? null : content.length, modifiedAt })).sort((a, b) => (a.kind === b.kind ? a.name.localeCompare(b.name) : a.kind === 'directory' ? -1 : 1));
    return { path, entries: entries.slice(offset, offset + 200), nextOffset: entries.length > offset + 200 ? offset + 200 : null };
  },
  async getStorageFile(volume: string, path: string): Promise<StorageFile> {
    const content = files[volume]?.[path];
    if (typeof content !== 'string') throw new Error('Archivo no disponible.');
    return { name: path.split('/').pop()!, sizeBytes: content.length, modifiedAt, kind: content.includes('\u0000') ? 'unsupported' : 'text', content: content.includes('\u0000') ? undefined : content, message: content.includes('\u0000') ? 'Archivo binario: vista previa no disponible.' : undefined };
  },
};
