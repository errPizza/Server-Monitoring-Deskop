import React from 'react';

export function DesktopStyles() { return <style>{`
:root { color-scheme: dark; --accent: #46ed80; --muted: #939aa4; --border: #252a30; }
* { box-sizing: border-box; }
body { background: #0b0d0e; }
button, input { font: inherit; }
button { cursor: pointer; }
button:disabled { cursor: wait; opacity: .5; }
button, [role="button"], input { transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, opacity 150ms ease; }
button:focus-visible, [role="button"]:focus-visible, input:focus-visible, [role="slider"]:focus-visible { outline: 2px solid var(--accent) !important; outline-offset: 4px; }
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-thumb { background: #363c44; border-radius: 8px; }
::-webkit-scrollbar-track { background: transparent; }
.desktop-shell { display: flex; height: 100%; min-height: 0; color: #edf0f3; font: 13px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
.sidebar { width: 228px; flex: 0 0 auto; display: flex; flex-direction: column; background: #0d1011; border-right: 1px solid var(--border); transition: width 180ms ease; }
.sidebar.compact { width: 76px; }
.brand { height: 86px; display: flex; align-items: center; gap: 12px; padding: 24px; overflow: hidden; white-space: nowrap; }
.brand-mark { display: grid; place-items: center; width: 30px; height: 30px; flex-shrink: 0; color: #121813; background: var(--accent); border-radius: 9px; font-size: 17px; font-weight: 800; }
.brand strong { font-size: 16px; letter-spacing: -.5px; }
.brand small { display: block; color: var(--muted); font-size: 10px; margin-top: 3px; letter-spacing: 1px; }
.sidebar nav { flex: 1; overflow-y: auto; padding: 0 12px 18px; }
.nav-group { color: #757e8a; font-size: 9px; font-weight: 600; letter-spacing: 1.6px; padding: 23px 14px 10px; }
.nav-item { border: 1px solid transparent; width: 100%; background: transparent; color: #a0a7b1; padding: 11px 13px; border-radius: 8px; display: flex; align-items: center; gap: 12px; text-align: left; margin-bottom: 3px; white-space: nowrap; }
.nav-item:hover { background: #1e2329; color: #fff; }
.nav-item.active { color: #80ffa9; background: #46ed800d; border-color: #46ed801c; }
.nav-item.active::after { content: ''; margin-left: auto; width: 5px; height: 5px; background: var(--accent); border-radius: 50%; }
.compact .nav-item { justify-content: center; padding: 12px 0; }
.compact .nav-item.active::after { display: none; }
.compact .nav-group { font-size: 0; padding: 12px 0 0; }
.sidebar-bottom { border-top: 1px solid var(--border); padding: 16px; }
.environment { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #a0a7b1; margin: 4px 0 16px; }
.status-dot { display: inline-block; width: 6px; height: 6px; background: var(--accent); border-radius: 50%; }
.status-dot.demo { background: #d5b780; }
.desktop-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }
.toolbar { height: 68px; flex-shrink: 0; padding: 0 32px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--border); gap: 12px; }
.breadcrumb { display: flex; gap: 12px; align-items: center; color: #737d89; }
.breadcrumb strong { color: #dbe0e6; font-weight: 500; }
.toolbar-actions { display: flex; align-items: center; gap: 16px; }
.toolbar-meta { color: #858e99; font-size: 11px; }
.quiet-button { display: flex; align-items: center; justify-content: center; gap: 8px; background: #1a1e23; color: #c5cbd3; border: 1px solid #2c323a; border-radius: 7px; padding: 8px 12px; font-size: 11px; }
.quiet-button:hover { background: #252b33; border-color: #4b565f; }
.page-stage { flex: 1; min-height: 0; display: flex; flex-direction: column; animation: page-enter 220ms ease-out both; }
.error-banner { padding: 12px 32px; color: #f1b3b3; background: #382020; font-size: 12px; }
.chart-interactive { position: relative; width: 100%; touch-action: pan-y; outline: none; }
.chart-tooltip { position: absolute; top: 0; right: 0; background: #252c33; color: #edf0f3; border: 1px solid #39434d; border-radius: 6px; padding: 5px 9px; font: 11px monospace; pointer-events: none; }
.chart-axis { display: flex; justify-content: space-between; color: #858e99; font-size: 10px; padding-top: 12px; }
.spin { animation: spin 1s linear infinite; display: inline-flex; }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes page-enter { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
@media(max-width: 1180px) { #overview-metrics > div { flex-basis: calc(50% - 7px); min-width: 0; } }
@media(max-width: 1100px) { .toolbar-meta { display: none; } .toolbar { padding: 0 22px; } }
[data-testid="surface-card"] { border-radius: 18px; box-shadow: inset 0 1px 0 #ffffff06; transition: border-color 180ms ease, box-shadow 180ms ease; }
[data-testid="surface-card"]:hover { border-color: #526066; box-shadow: inset 0 1px 0 #ffffff09, 0 8px 28px #00000025; }
.metric-atmosphere { position: absolute; inset: 0; pointer-events: none; opacity: .15; }
.metric-atmosphere.luminous { opacity: 1; }
.dot-ring { position: absolute; width: 84px; height: 84px; right: 16px; top: 20px; }
.dot-ring circle { transition: fill 350ms ease; }
.dot-capacity { display: grid; grid-template-columns: repeat(30, 1fr); gap: 5px; padding: 8px 0; width: 100%; }
.dot-capacity span { width: 4px; height: 4px; border-radius: 50%; justify-self: center; transition: background 300ms ease; }
.device-hero { position: relative; display: flex; min-height: 280px; border: 1px solid #394447; border-radius: 20px; overflow: hidden; background: radial-gradient(ellipse at 75% 45%, #15303555, transparent 52%), #0a0d0e; }
.device-copy { position: relative; z-index: 1; width: 50%; padding: 30px; }
.device-kicker { color: #839496; font-size: 9px; letter-spacing: 2px; }
.device-copy h2 { color: #eefcfd; font-size: 26px; letter-spacing: -.8px; font-weight: 600; margin: 13px 0; }
.device-copy p { font-size: 14px; line-height: 1.6; color: #95a5a8; margin: 0 0 22px; }
.device-connection { display: flex; align-items: center; flex-wrap: wrap; gap: 10px; width: fit-content; border: 1px solid #35433d; background: #070b09; padding: 10px 14px; border-radius: 12px; font-size: 11px; }
.device-connection strong { color: #46ed80; font-size: 10px; letter-spacing: .7px; }
.device-connection span:last-child { color: #dce9ea; }
.connection-light { width: 6px; height: 6px; background: #46ed80; box-shadow: 0 0 12px #46ed8099; border-radius: 50%; }
.connection-light.offline { background: #fa6573; box-shadow: none; }
.device-uptime { display: flex; gap: 12px; color: #8a9a9c; font-size: 9px; letter-spacing: 1px; margin-top: 16px; }
.device-uptime strong { color: #cad8da; font-weight: 500; letter-spacing: .4px; }
.device-art { position: relative; flex: 1; display: grid; place-items: center; background-image: radial-gradient(#67878c65 1px, transparent 1px); background-size: 10px 10px; mask-image: linear-gradient(90deg, transparent, black 18%, black 82%, transparent); }
.server-render { position: relative; width: 100%; max-width: 390px; height: 250px; filter: drop-shadow(0 10px 20px #0008); transition: transform 500ms ease; }
.device-hero:hover .server-render { transform: translateY(-5px) rotate(2deg); }
.device-orbit { position: absolute; width: 210px; height: 210px; border: 1px solid #59d7ff20; border-radius: 50%; box-shadow: 0 0 90px #22ceff12; }
.device-art-label { position: absolute; bottom: 14px; color: #8aa5ac; font: 8px monospace; letter-spacing: 1.5px; }
.device-index { position: absolute; top: 19px; right: 24px; font: 12px monospace; color: #d5e8ed; }
.device-index span { font-size: 9px; color: #71898e; }
@media(max-width: 1180px) { .device-copy { padding: 24px; } .device-copy h2 { font-size: 23px; } .dot-ring { width: 68px; height: 68px; right: 12px; } }
@media(prefers-reduced-motion: reduce) { *, *::before, *::after { animation: none !important; transition: none !important; scroll-behavior: auto !important; } }
`}</style>; }
