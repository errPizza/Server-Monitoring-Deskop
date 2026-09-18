import React, { useId, useMemo, useState } from 'react';
import { colors } from '../theme';

export function MiniChart({ data, color = colors.blue, height = 78, labels }: { data: number[]; color?: string; height?: number; labels?: [string, string] }) {
  const id = useId().replace(/:/g, '');
  const [active, setActive] = useState<number | null>(null);
  const values = useMemo(() => data.map(value => Number.isFinite(value) ? Math.max(0, value) : 0), [data]);
  const width = 800, pad = 8;
  const maximum = Math.max(...values, 1);
  const points = useMemo(() => values.map((value, index) => ({ x: pad + index / Math.max(values.length - 1, 1) * (width - pad * 2), y: height - pad - value / maximum * (height - pad * 2) })), [values, height, maximum]);
  const line = points.map((point, index) => `${index ? 'L' : 'M'}${point.x},${point.y}`).join(' ');
  const index = active === null ? null : Math.min(active, values.length - 1);
  const point = index === null ? null : points[index];
  if (!values.length) return <div style={{ height, display: 'grid', placeItems: 'center', color: colors.muted, fontSize: 12 }}>Sin datos disponibles</div>;
  return <div>
    <div className="chart-interactive" style={{ height }} tabIndex={0} role="slider" aria-label="Explorar muestras del gráfico" aria-valuemin={1} aria-valuemax={values.length} aria-valuenow={(index ?? 0) + 1} aria-valuetext={`Muestra ${(index ?? 0) + 1}: ${values[index ?? 0]}`} onFocus={() => setActive(0)} onBlur={() => setActive(null)} onPointerLeave={() => setActive(null)} onPointerMove={event => { const bounds = event.currentTarget.getBoundingClientRect(); const ratio = (event.clientX - bounds.left) / bounds.width; setActive(Math.max(0, Math.min(values.length - 1, Math.round(ratio * (values.length - 1))))); }} onKeyDown={event => { if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return; event.preventDefault(); setActive(event.key === 'Home' ? 0 : event.key === 'End' ? values.length - 1 : Math.max(0, Math.min(values.length - 1, (active ?? 0) + (event.key === 'ArrowRight' ? 1 : -1)))); }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        <defs><linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".19" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {[0, .5, 1].map(fraction => <line key={fraction} x1="0" x2={width} y1={pad + fraction * (height - pad * 2)} y2={pad + fraction * (height - pad * 2)} stroke="#303740" strokeDasharray="3 6" strokeWidth=".6" />)}
        <path d={`${line} L${points[points.length - 1].x},${height} L${pad},${height} Z`} fill={`url(#${id})`} />
        <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
        {points.length === 1 && <circle cx={points[0].x} cy={points[0].y} r="3" fill={color} />}
        {point && <><line x1={point.x} x2={point.x} y1="0" y2={height} stroke={color} strokeOpacity=".45" strokeDasharray="3 4" /><circle cx={point.x} cy={point.y} r="4" fill={color} stroke="#181c21" strokeWidth="2" /></>}
      </svg>
      {index !== null && <div className="chart-tooltip">Muestra {index + 1} · {values[index].toLocaleString()}</div>}
    </div>
    {labels && <div className="chart-axis"><span>{labels[0]}</span><span>{labels[1]}</span></div>}
  </div>;
}
