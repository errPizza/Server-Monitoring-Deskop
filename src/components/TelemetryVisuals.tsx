import React, { useId } from 'react';

export function DotRing({ value, color = '#46ed80' }: { value: number | null; color?: string }) {
  const count = 32;
  const filled = value === null ? 0 : Math.round(Math.max(0, Math.min(100, value)) / 100 * count);
  return <svg className="dot-ring" viewBox="0 0 100 100" aria-hidden="true">{Array.from({ length: count }, (_, i) => {
    const angle = (i / count * 360 - 90) * Math.PI / 180;
    return <circle key={i} cx={50 + Math.cos(angle) * 40} cy={50 + Math.sin(angle) * 40} r="2.5" fill={i < filled ? color : '#34393b'} style={i < filled ? { filter: `drop-shadow(0 0 3px ${color}88)` } : undefined} />;
  })}</svg>;
}
export function DotCapacity({ value, color = '#46ed80', label = 'Capacidad utilizada' }: { value: number | null; color?: string; label?: string }) {
  const bounded = value === null ? null : Math.max(0, Math.min(100, value));
  return <div className="dot-capacity" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={bounded ?? undefined} aria-valuetext={bounded === null ? 'Sin datos' : `${bounded.toFixed(1)}%`}>
    {Array.from({ length: 60 }, (_, i) => <span key={i} style={{ background: bounded !== null && i < Math.round(bounded / 100 * 60) ? color : '#303637', boxShadow: bounded !== null && i < Math.round(bounded / 100 * 60) ? `0 0 7px ${color}55` : 'none' }} />)}
  </div>;
}
export function DeviceHero({ name, host, uptime, demo, offline }: { name: string; host: string; uptime: string; demo: boolean; offline: boolean }) {
  const id = useId().replace(/:/g, '');
  return <section className="device-hero" aria-label="Servidor monitorizado">
    <div className="device-copy"><div className="device-kicker">TU INFRAESTRUCTURA</div><h2>{name}</h2><p>Pequeño equipo.<br />Todo bajo control.</p><div className="device-connection"><span className={`connection-light ${offline ? 'offline' : ''}`} /><strong>{demo ? 'DEMO' : offline ? 'SIN CONEXIÓN' : 'SERVIDOR'}</strong><span>{host}</span></div><div className="device-uptime">TIEMPO ACTIVO <strong>{uptime}</strong></div></div>
    <div className="device-art" aria-hidden="true"><div className="device-orbit" />
      <svg viewBox="0 0 420 260" className="server-render">
        <defs><linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1"><stop stopColor="#f1fbff" /><stop offset=".45" stopColor="#b9ccd1" /><stop offset="1" stopColor="#627c85" /></linearGradient><linearGradient id={`${id}-side`}><stop stopColor="#4b6067" /><stop offset="1" stopColor="#26363c" /></linearGradient></defs>
        <ellipse cx="222" cy="231" rx="120" ry="14" fill="#000" opacity=".7" />
        <g transform="translate(125 20) rotate(-12 85 110)"><path d="M0 12 L24 0 L188 0 L188 208 L164 224 L0 224Z" fill={`url(#${id}-side)`} stroke="#758d95" /><rect x="0" y="12" width="164" height="212" rx="9" fill={`url(#${id}-metal)`} stroke="#e1f7ff" />
          {Array.from({ length: 12 }, (_, i) => <g key={i}><path d={`M${13 + i * 12} 63 V205`} stroke="#617d88" strokeWidth="3" /><path d={`M${15 + i * 12} 63 V205`} stroke="#e1f1f5" strokeWidth="2" /></g>)}
          <rect x="18" y="26" width="128" height="26" rx="3" fill="#cde0e6" stroke="#93acb5" /><text x="82" y="43" textAnchor="middle" fontFamily="monospace" fontSize="10" fill="#3b5966" letterSpacing="3">AGM / NODE</text><circle cx="146" cy="214" r="3" fill={offline ? '#fa6573' : '#46ed80'} /><path d="M172 25 V180 M180 20 V176" stroke="#91a8b0" strokeWidth="2" />
        </g>
      </svg><span className="device-art-label">SERVER NODE · VISTA ILUSTRATIVA</span>
    </div>
    <div className="device-index">01 <span>/ SERVER</span></div>
  </section>;
}
