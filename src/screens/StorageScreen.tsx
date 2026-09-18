import { DotCapacity } from '../components/TelemetryVisuals';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Card, PageHeader, StatusBadge } from '../components/Primitives';
import { colors } from '../theme';
import { environment } from '../config/environment';
import { StorageDirectory, StorageDisk, StorageFile, StorageVolume, formatBytes } from '../models/storage';
import { storageRepository } from '../repositories/StorageRepository';

type Location = { volume: StorageVolume; path: string; file?: boolean } | null;
export function StorageScreen() {
  const [disks, setDisks] = useState<StorageDisk[]>([]);
  const [location, setLocation] = useState<Location>(null);
  const [directory, setDirectory] = useState<StorageDirectory>();
  const [file, setFile] = useState<StorageFile>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [revision, setRevision] = useState(0);
  const requestId = useRef(0);
  const local = environment.mode === 'mock' || environment.bypassAuth;
  const refresh = () => setRevision(value => value + 1);
  useEffect(() => {
    const id = ++requestId.current;
    setLoading(true); setError(undefined); setDirectory(undefined); setFile(undefined);
    const load = async () => {
      try {
        if (!location) { const result = await storageRepository.getStorageDisks(); if (id === requestId.current) setDisks(result); }
        else if (location.file) { const result = await storageRepository.getStorageFile(location.volume.id, location.path); if (id === requestId.current) setFile(result); }
        else { const result = await storageRepository.getStorageDirectory(location.volume.id, location.path); if (id === requestId.current) setDirectory(result); }
      } catch (cause) { if (id === requestId.current) setError(cause instanceof Error ? cause.message : 'No se pudo acceder al almacenamiento.'); }
      finally { if (id === requestId.current) setLoading(false); }
    };
    void load();
    return () => { requestId.current++; };
  }, [location, revision]);
  const back = useCallback(() => {
    if (!location) return false;
    if (!location.path) setLocation(null);
    else setLocation({ volume: location.volume, path: location.path.split('/').slice(0, -1).join('/') });
    return true;
  }, [location]);
  useEffect(() => { const subscription = BackHandler.addEventListener('hardwareBackPress', back); return () => subscription.remove(); }, [back]);
  const more = async () => {
    if (!location || !directory || directory.nextOffset === null || loading) return;
    const id = requestId.current; setLoading(true); setError(undefined);
    try {
      const result = await storageRepository.getStorageDirectory(location.volume.id, location.path, directory.nextOffset);
      if (id === requestId.current) setDirectory({ ...result, entries: [...directory.entries, ...result.entries] });
    } catch (cause) { if (id === requestId.current) setError(cause instanceof Error ? cause.message : 'No se pudieron cargar más archivos.'); }
    finally { if (id === requestId.current) setLoading(false); }
  };
  return <Screen onRefresh={refresh} refreshing={loading}>
    <PageHeader eyebrow="SERVIDOR" title="Almacenamiento" right={local ? <StatusBadge status="warning" label="SIMULADO" /> : undefined} />
    <Text style={styles.muted}>{local ? 'Discos y archivos de ejemplo · bypass activo' : 'Discos del servidor · exploración de archivos en solo lectura'}</Text>
    {location && <View style={styles.breadcrumb}>
      <Button label="Volver" icon="arrow-back" onPress={back} />
      <Pressable accessibilityRole="button" accessibilityLabel="Todos los discos" onPress={() => setLocation(null)} style={styles.crumb}><Text style={styles.link}>Discos</Text></Pressable>
      <Text style={styles.muted}>/</Text><Pressable accessibilityRole="button" onPress={() => setLocation({ volume: location.volume, path: '' })} style={styles.crumb}><Text style={styles.link}>{location.volume.name}</Text></Pressable>
    </View>}
    {location && <Text selectable style={styles.path}>{location.volume.mountPoint?.replace(/\/$/, '')}/{location.path}</Text>}
    {error && <Card><Text accessibilityRole="alert" style={styles.error}>{error}</Text><Button label="Reintentar" icon="refresh" onPress={refresh} /></Card>}
    {loading && !directory && <View style={styles.loading}><ActivityIndicator color={colors.muted} /><Text style={styles.muted}>Cargando {location ? 'archivos' : 'discos'}…</Text></View>}
    {!loading && !error && !location && disks.length === 0 && <Card><Text style={styles.muted}>No se detectaron discos en el servidor.</Text></Card>}
    {!location && !loading && !error && disks.map(disk => <Card key={disk.id} style={styles.disk}>
      <View style={styles.diskHeading}><View style={styles.diskIcon}><Ionicons name="server-outline" size={24} color={colors.text} /></View><View style={styles.grow}><Text style={styles.diskTitle}>{disk.name}</Text><Text style={styles.muted}>{disk.device} · {disk.model || 'Disco'}</Text></View><Text style={styles.capacity}>{formatBytes(disk.sizeBytes)}</Text></View>
      {disk.volumes.length === 0 && <Text style={styles.muted}>Sin volúmenes disponibles.</Text>}
      {disk.volumes.map(volume => {
        const percent = volume.usedBytes !== null && volume.totalBytes > 0 ? Math.min(100, Math.max(0, volume.usedBytes / volume.totalBytes * 100)) : null;
        return <View key={volume.id} style={styles.volume}>
          <View style={styles.row}><Text style={styles.volumeTitle}>{volume.name}</Text><Text style={styles.muted}>{volume.filesystem ?? 'Sin formato'}</Text></View>
          <Text style={styles.muted}>{volume.mountPoint ?? 'Sin montar'}</Text>
          <DotCapacity value={percent} color={percent !== null && percent > 90 ? colors.orange : colors.green} label={`Uso de ${volume.name}`} />
          <View style={styles.row}><Text style={styles.muted}>Disponible</Text><Text style={{ color: colors.text, fontSize: 30, fontWeight: '500', letterSpacing: -1 }}>{volume.freeBytes === null ? 'N/A' : formatBytes(volume.freeBytes)}</Text></View>
          <View style={styles.row}><Text style={styles.muted}>{volume.usedBytes === null ? 'Uso no disponible' : `${formatBytes(volume.usedBytes)} usados`}</Text><Text style={styles.capacity}>{percent === null ? '—' : `${percent.toFixed(1)}%`}</Text></View>
          <Text style={styles.muted}>{formatBytes(volume.totalBytes)} total{volume.freeBytes === null ? '' : ` · ${formatBytes(volume.freeBytes)} libres`}</Text>
          {volume.browsable ? <Button label={`Explorar ${volume.name}`} icon="folder-open-outline" onPress={() => setLocation({ volume, path: '' })} /> : <Text style={styles.muted}>{volume.unavailableReason ?? 'No se puede explorar este volumen.'}</Text>}
        </View>;
      })}
    </Card>)}
    {location && directory && <Card style={styles.fileList}>
      {!directory.entries.length && <Text style={styles.empty}>Esta carpeta está vacía.</Text>}
      {directory.entries.map(entry => <Pressable key={entry.path} disabled={entry.kind !== 'directory' && entry.kind !== 'file'} accessibilityRole="button" accessibilityLabel={`${entry.kind === 'directory' ? 'Abrir carpeta' : 'Abrir archivo'} ${entry.name}`} onPress={() => setLocation({ volume: location.volume, path: entry.path, file: entry.kind === 'file' })} style={({ pressed }) => [styles.fileRow, pressed && { backgroundColor: colors.surfaceRaised }]}>
        <Ionicons name={entry.kind === 'directory' ? 'folder-outline' : entry.kind === 'symlink' ? 'link-outline' : 'document-outline'} size={22} color={entry.kind === 'directory' ? colors.text : colors.muted} />
        <View style={styles.grow}><Text style={styles.filename}>{entry.name}</Text><Text style={styles.small}>{entry.kind === 'directory' ? 'Carpeta' : entry.kind === 'symlink' ? 'Enlace · acceso deshabilitado' : formatBytes(entry.sizeBytes)}{entry.modifiedAt ? ` · ${new Date(entry.modifiedAt).toLocaleDateString()}` : ''}</Text></View>
        <Ionicons name="chevron-forward" size={16} color={colors.subtle} />
      </Pressable>)}
      {directory.nextOffset !== null && <Button label={loading ? 'Cargando…' : 'Cargar más'} icon="add" onPress={() => void more()} disabled={loading} />}
    </Card>}
    {file && <Card style={styles.disk}>
      <Text selectable style={styles.diskTitle}>{file.name}</Text><Text style={styles.muted}>{formatBytes(file.sizeBytes)} · {new Date(file.modifiedAt).toLocaleString()}</Text>
      {file.kind === 'text' && <Text selectable style={styles.code}>{file.content || '(Archivo vacío)'}</Text>}
      {file.kind === 'image' && <Image accessibilityLabel={file.name} source={{ uri: `data:${file.mimeType};base64,${file.content}` }} resizeMode="contain" style={styles.image} />}
      {file.truncated && <Text style={styles.muted}>Vista previa parcial: se muestran los primeros 256 KiB.</Text>}
      {file.message && <Text style={styles.muted}>{file.message}</Text>}
    </Card>}
  </Screen>;
}
function Button({ label, icon, onPress, disabled = false }: { label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, (pressed || disabled) && { opacity: 0.6 }]}><Ionicons name={icon} size={17} color={colors.text} /><Text style={styles.buttonText}>{label}</Text></Pressable>;
}
const styles = StyleSheet.create({
  muted: { color: colors.muted, fontSize: 12, lineHeight: 18 }, small: { color: colors.muted, fontSize: 10, marginTop: 4 }, error: { color: colors.red, fontSize: 13, lineHeight: 20, marginBottom: 12 }, loading: { alignItems: 'center', padding: 32, gap: 12 },
  disk: { gap: 14 }, diskHeading: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 }, diskIcon: { width: 44, height: 44, borderRadius: 10, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' }, grow: { flex: 1, minWidth: 0 }, diskTitle: { color: colors.text, fontWeight: '700', fontSize: 17 }, capacity: { color: colors.text, fontSize: 12, fontWeight: '600' },
  volume: { gap: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 14 }, volumeTitle: { color: colors.text, fontSize: 13, fontWeight: '700' }, row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }, track: { height: 6, borderRadius: 3, backgroundColor: colors.surfaceRaised, overflow: 'hidden' },
  button: { minHeight: 44, borderRadius: 7, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceRaised, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }, buttonText: { color: colors.text, fontWeight: '600', fontSize: 12 }, breadcrumb: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }, crumb: { minHeight: 44, justifyContent: 'center' }, link: { color: colors.text, fontSize: 12, textDecorationLine: 'underline' }, path: { color: colors.muted, fontSize: 12, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  fileList: { padding: 0, overflow: 'hidden' }, fileRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 64, borderBottomWidth: 1, borderBottomColor: colors.border }, filename: { color: colors.text, fontSize: 14 }, empty: { color: colors.muted, padding: 24, textAlign: 'center' }, code: { backgroundColor: colors.terminal, color: colors.text, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 12, lineHeight: 20, padding: 12 }, image: { width: '100%', height: 300 },
});
