export interface StorageVolume {
  id: string; name: string; mountPoint: string | null; filesystem: string | null;
  totalBytes: number; usedBytes: number | null; freeBytes: number | null;
  browsable: boolean; unavailableReason?: string;
}
export interface StorageDisk {
  id: string; name: string; device: string; model: string; sizeBytes: number; volumes: StorageVolume[];
}
export interface StorageEntry {
  name: string; path: string; kind: 'directory' | 'file' | 'symlink' | 'other';
  sizeBytes: number | null; modifiedAt: string | null;
}
export interface StorageDirectory {
  path: string; entries: StorageEntry[]; nextOffset: number | null;
}
export interface StorageFile {
  name: string; sizeBytes: number; modifiedAt: string; kind: 'text' | 'image' | 'unsupported';
  content?: string; mimeType?: string; truncated?: boolean; message?: string;
}
export function formatBytes(bytes: number | null): string {
  if (bytes === null || !Number.isFinite(bytes)) return 'No disponible';
  if (bytes === 0) return '0 B';
  const unit = Math.min(4, Math.max(0, Math.floor(Math.log(bytes) / Math.log(1024))));
  return `${(bytes / 1024 ** unit).toLocaleString('es', { maximumFractionDigits: unit ? 1 : 0 })} ${['B', 'KiB', 'MiB', 'GiB', 'TiB'][unit]}`;
}
