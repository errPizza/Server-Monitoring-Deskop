import React, { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../state/AuthContext';
import { useMonitoring } from '../state/MonitoringContext';
import { environment } from '../config/environment';
import { DesktopStyles } from '../components/DesktopStyles';
import { DashboardScreen } from '../screens/DashboardScreen';
import { HardwareScreen } from '../screens/HardwareScreen';
import { TrafficScreen } from '../screens/TrafficScreen';
import { LogsScreen } from '../screens/LogsScreen';
import { AlertsScreen, DockerScreen, ErrorsScreen, NginxScreen, RemoteControlScreen, StatisticsScreen } from '../screens/SecondaryScreens';
import { SettingsScreen } from '../screens/MoreScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { StorageScreen } from '../screens/StorageScreen';
const pages = [
  ['ESPACIO DE TRABAJO', 'Vista general', 'grid-outline', DashboardScreen],
  ['ESPACIO DE TRABAJO', 'Estadísticas', 'analytics-outline', StatisticsScreen],
  ['INFRAESTRUCTURA', 'Raspberry Pi', 'hardware-chip-outline', HardwareScreen],
  ['INFRAESTRUCTURA', 'Almacenamiento', 'file-tray-stacked-outline', StorageScreen],
  ['INFRAESTRUCTURA', 'Docker', 'cube-outline', DockerScreen],
  ['INFRAESTRUCTURA', 'Nginx', 'globe-outline', NginxScreen],
  ['OBSERVABILIDAD', 'Requests', 'pulse-outline', TrafficScreen],
  ['OBSERVABILIDAD', 'Logs', 'terminal-outline', LogsScreen],
  ['OBSERVABILIDAD', 'Errores', 'warning-outline', ErrorsScreen],
  ['OBSERVABILIDAD', 'Alertas', 'notifications-outline', AlertsScreen],
  ['ADMINISTRACIÓN', 'Control remoto', 'options-outline', RemoteControlScreen],
  ['ADMINISTRACIÓN', 'Ajustes', 'settings-outline', SettingsScreen],
] as const;
export function DesktopShell() {
  const { state, logout } = useAuth();
  const { refresh, dashboard, error, autoRefresh } = useMonitoring();
  const [selected, setSelected] = useState(0);
  const [compact, setCompact] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const Page = pages[selected][3];
  const update = async () => { setRefreshing(true); try { await refresh(); } finally { setRefreshing(false); } };
  if (state !== 'authenticated') return <><DesktopStyles /><LoginScreen /></>;
  return <><DesktopStyles /><div className="desktop-shell">
    <aside className={`sidebar ${compact ? 'compact' : ''}`} aria-label="Navegación principal">
      <div className="brand"><span className="brand-mark">a</span>{!compact && <div><strong>AGM Monitor</strong><small>SERVER WORKSPACE</small></div>}</div>
      <nav>{pages.map(([group, label, icon], index) => <React.Fragment key={label}>
        {(index === 0 || pages[index - 1][0] !== group) && <div className="nav-group">{group}</div>}
        <button title={label} aria-label={label} aria-current={selected === index ? 'page' : undefined} className={`nav-item ${selected === index ? 'active' : ''}`} onClick={() => setSelected(index)}><Ionicons name={icon} size={17} color={selected === index ? '#46ed80' : '#939aa4'} />{!compact && <span>{label}</span>}</button>
      </React.Fragment>)}</nav>
      <div className="sidebar-bottom">
        {!compact && <div className="environment"><span className={`status-dot ${environment.mode === 'mock' ? 'demo' : ''}`} />{environment.mode === 'mock' ? 'Entorno de demostración' : 'Entorno de producción'}</div>}
        <button className="quiet-button" style={{ width: '100%' }} title={compact ? 'Expandir menú' : 'Contraer menú'} aria-label={compact ? 'Expandir menú' : 'Contraer menú'} onClick={() => setCompact(!compact)}><Ionicons name={compact ? 'chevron-forward' : 'chevron-back'} size={14} color="#939aa4" />{!compact && 'Contraer menú'}</button>
        {environment.mode === 'production' && <button className="nav-item" aria-label="Cerrar sesión" onClick={() => { void logout().catch(() => setSessionError('No se pudo cerrar la sesión. Inténtalo otra vez.')); }}><Ionicons name="log-out-outline" size={16} color="#939aa4" />{!compact && 'Cerrar sesión'}</button>}
      </div>
    </aside>
    <main className="desktop-main">
      <header className="toolbar"><div className="breadcrumb"><span>Workspace</span><span>/</span><strong>{pages[selected][1]}</strong></div><div className="toolbar-actions"><span className="toolbar-meta">{autoRefresh ? 'Actualización cada 30 s' : 'Actualización manual'}{dashboard ? ` · ${new Date(dashboard.server.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}</span><button className="quiet-button" disabled={refreshing} onClick={() => void update()}><span className={refreshing ? 'spin' : ''}><Ionicons name="refresh-outline" color="#b4bfc9" size={14} /></span>{refreshing ? 'Actualizando' : 'Actualizar'}</button></div></header>
      {(error || sessionError) && <div role="alert" className="error-banner">{error || sessionError}{error && ' · Los datos anteriores pueden estar desactualizados.'}</div>}
      <div className="page-stage" key={selected}><Page /></div>
    </main>
  </div></>;
}
