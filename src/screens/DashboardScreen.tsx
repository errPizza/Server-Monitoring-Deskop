import { DeviceHero, DotCapacity } from '../components/TelemetryVisuals';
import React from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Screen } from '../components/Screen';
import { Card, MetricCard, PageHeader, SectionTitle, StateView, StatusBadge } from '../components/Primitives';
import { MiniChart } from '../components/Chart';
import { useMonitoring } from '../state/MonitoringContext';
import { environment } from '../config/environment';
import { colors } from '../theme';

export function DashboardScreen() {
  const { dashboard: d, state, error, refresh } = useMonitoring();
  const { width } = useWindowDimensions();
  if (!d) return <Screen><PageHeader eyebrow="TU INFRAESTRUCTURA, DE UN VISTAZO" title="Vista general" /><StateView kind={state === 'loading' ? 'loading' : state === 'unauthorized' ? 'unauthorized' : 'error'} message={error} onRetry={() => void refresh()} /></Screen>;
  const demo = environment.mode === 'mock';
  const memory = d.metrics.ramTotal > 0 ? Math.round(d.metrics.ramUsed / d.metrics.ramTotal * 100) : null;
  const disk = d.metrics.diskUsed !== null && d.metrics.diskTotal ? Math.round(d.metrics.diskUsed / d.metrics.diskTotal * 100) : null;
  const running = d.docker.filter(container => container.status === 'running').length;
  const wide = width > 1180;
  return <Screen>
    <PageHeader eyebrow="WORKSPACE / OVERVIEW" title="Tu servidor, en perspectiva." right={<StatusBadge status={demo ? 'warning' : error ? 'error' : d.server.health} label={demo ? 'DEMOSTRACIÓN' : error ? 'SIN CONEXIÓN' : d.server.health.toUpperCase()} />} />
    <Text style={styles.subtitle}>Rendimiento, actividad y servicios. Todo en un mismo lugar.</Text>
    <DeviceHero name={d.server.name} host={d.server.host} uptime={d.server.uptime} demo={demo} offline={Boolean(error) || d.server.health === 'offline'} />
    <View nativeID="overview-metrics" style={styles.grid}>
      <MetricCard icon="hardware-chip-outline" percent={d.metrics.cpu} label="PROCESADOR" value={d.metrics.cpu === null ? 'N/A' : `${d.metrics.cpu}%`} detail={d.metrics.cores.length ? `${d.metrics.cores.length} núcleos · utilización actual` : 'Utilización actual'} color={colors.green} />
      <MetricCard icon="layers-outline" percent={memory} label="MEMORIA" value={memory === null ? 'N/A' : `${memory}%`} detail={`${d.metrics.ramUsed} de ${d.metrics.ramTotal} GB`} color={colors.blue} />
      <MetricCard icon="thermometer-outline" luminous label="TEMPERATURA" value={d.metrics.temperature === null ? 'N/A' : `${d.metrics.temperature}°C`} detail={d.metrics.temperature === null ? 'Sensor no disponible' : 'Lectura actual del sensor'} color={d.metrics.temperature !== null && d.metrics.temperature >= 80 ? colors.red : colors.green} />
      <MetricCard icon="pulse-outline" luminous label="REQUESTS / MIN" value={d.requests.perMinute.toLocaleString()} detail={`${d.requests.total} solicitudes acumuladas`} color={colors.blue} />
    </View>
    <View style={[styles.columns, !wide && { flexDirection: 'column' }]}>
      <Card style={{ flex: wide ? 1.8 : undefined, minWidth: 0 }}>
        <SectionTitle title="Tráfico de solicitudes" action={<Text style={styles.caption}>HISTORIAL DISPONIBLE</Text>} />
        <View style={styles.chartSummary}><Text style={styles.large}>{d.requests.perMinute.toLocaleString()}<Text style={styles.unit}> / min</Text></Text><Text style={styles.caption}>{demo ? 'Serie simulada' : 'Muestras de la API'}</Text></View>
        <MiniChart data={d.requests.history} height={160} color={colors.green} labels={['Primera muestra', 'Última muestra']} />
      </Card>
      <Card style={{ flex: wide ? 1 : undefined, minWidth: 0 }}>
        <SectionTitle title="Estado de servicios" />
        <View style={styles.service}><View style={styles.serviceTitle}><Ionicons name="cube-outline" size={19} color={colors.blue} /><Text style={styles.label}>Docker</Text></View><StatusBadge status={running === d.docker.length && running > 0 ? 'running' : 'warning'} label={`${running} / ${d.docker.length} ACTIVOS`} /></View>
        <Text style={styles.caption}>Contenedores en ejecución</Text>
        <View style={[styles.service, styles.divider]}><View style={styles.serviceTitle}><Ionicons name="globe-outline" size={19} color={colors.green} /><Text style={styles.label}>Nginx</Text></View><StatusBadge status={d.nginx.health} /></View>
        <Text style={styles.caption}>{d.nginx.active} conexiones activas</Text>
        <View style={[styles.service, styles.divider]}><Text style={styles.caption}>POTENCIA ACTUAL</Text><Text style={styles.label}>{d.power.watts === null ? 'N/A' : `${d.power.watts} W`}</Text></View>
      </Card>
    </View>
    <View style={[styles.columns, !wide && { flexDirection: 'column' }]}>
      <Card style={{ flex: wide ? 1.8 : undefined, minWidth: 0 }}>
        <SectionTitle title="Actividad reciente" action={<Text style={styles.caption}>{d.events.length} EVENTOS</Text>} />
        {!d.events.length && <Text style={[styles.caption, { paddingVertical: 28 }]}>No hay eventos recientes.</Text>}
        {d.events.slice(0, 5).map((event, index) => <View key={event.id} style={[styles.event, index > 0 && styles.eventBorder]}><View style={[styles.eventIcon, { backgroundColor: `${event.level === 'info' ? colors.green : colors.yellow}12` }]}><Ionicons name={event.level === 'info' ? 'checkmark-outline' : 'alert-outline'} size={14} color={event.level === 'info' ? colors.green : colors.yellow} /></View><View style={{ flex: 1, minWidth: 0 }}><Text style={styles.eventTitle}>{event.title}</Text><Text style={styles.caption} numberOfLines={2}>{event.detail}</Text></View><Text style={styles.eventTime}>{event.timestamp}</Text></View>)}
      </Card>
      <Card style={{ flex: wide ? 1 : undefined, minWidth: 0 }}>
        <SectionTitle title="Capacidad del sistema" />
        <Capacity label="Memoria RAM" value={memory} detail={`${d.metrics.ramUsed} / ${d.metrics.ramTotal} GB`} color={colors.blue} />
        <Capacity label="Almacenamiento" value={disk} detail={d.metrics.diskUsed === null || d.metrics.diskTotal === null ? 'Sin datos del colector' : `${d.metrics.diskUsed} / ${d.metrics.diskTotal} GB`} color={colors.purple} />
      </Card>
    </View>
    <Text style={styles.footer}>{demo ? 'Datos simulados · Sin conexión con tu servidor' : `Última lectura: ${new Date(d.server.lastUpdated).toLocaleString()}`} · AGM Server Monitoring</Text>
  </Screen>;
}
function Capacity({ label, value, detail, color }: { label: string; value: number | null; detail: string; color: string }) {
  return <View style={{ gap: 10, marginTop: 25 }}><View style={styles.serviceTitle}><Text style={[styles.label, { flex: 1 }]}>{label}</Text><Text style={styles.label}>{value === null ? 'N/A' : `${value}%`}</Text></View><DotCapacity value={value} color={color} label={label} /><Text style={styles.caption}>{detail}</Text></View>;
}
const styles = StyleSheet.create({
  subtitle: { color: colors.muted, fontSize: 13, marginTop: -9 }, caption: { color: colors.muted, fontSize: 11, lineHeight: 17 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 }, columns: { flexDirection: 'row', gap: 18, alignItems: 'stretch' },
  chartSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 22 }, large: { color: colors.text, fontSize: 30, letterSpacing: -1, fontWeight: '500' }, unit: { fontSize: 12, color: colors.muted, letterSpacing: 0 },
  service: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, paddingTop: 26, paddingBottom: 8 }, serviceTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 }, label: { color: colors.text, fontSize: 13, fontWeight: '500' }, divider: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 19, paddingTop: 19 },
  event: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 17 }, eventBorder: { borderTopWidth: 1, borderTopColor: colors.border }, eventIcon: { width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center' }, eventTitle: { color: colors.text, fontSize: 12, fontWeight: '500', marginBottom: 4 }, eventTime: { color: colors.subtle, fontSize: 10, maxWidth: 100, textAlign: 'right' }, footer: { color: colors.subtle, fontSize: 10, textAlign: 'center', paddingVertical: 8 },
});
