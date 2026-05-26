  // src/utils/index.js — Tokens de diseño y utilidades

export const T = {
  bg:    '#04090f', card:  '#080f18', card2: '#0c1824', card3: '#101f30',
  blue:  '#00b4ff', cyan:  '#00d4c8', green: '#00ffa3', purple:'#a464ff',
  red:   '#ff3d3d', orange:'#ff8c00', yellow:'#ffd700', pink:  '#ff4d9e',
  teal:  '#00b4cc',
  text:  '#d4ecff', muted: '#5a7d99', head:  '#ffffff',
  border:'rgba(0,180,255,.1)', borderHov:'rgba(0,180,255,.35)',
};

export const F = {
  head: "'Rajdhani',sans-serif",
  body: "'IBM Plex Sans',sans-serif",
  mono: "'IBM Plex Mono',monospace",
};

export const PIE_COLORS = [T.blue, T.green, T.purple, T.orange, T.cyan, T.pink, T.yellow, T.teal];

// ── Formateo ──────────────────────────────────────────────────────────────────
export const fmtDT = (iso) =>
  iso ? new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export const fmtD = (iso) =>
  iso ? new Date(iso).toLocaleDateString('es-CO') : '—';

export const fmtTime = (d) =>
  d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

export const fmtDateLong = (d) =>
  d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

// ── Validación placa colombiana ───────────────────────────────────────────────
export const validatePlate = (raw) => {
  const p = raw.toUpperCase().replace(/[-\s]/g, '');
  if (/^[A-Z]{3}\d{3}$/.test(p))       return { valid: true,  plate: p, kind: '🚗 Automóvil / Camioneta' };
  if (/^[A-Z]{3}\d{2}[A-Z]$/.test(p))  return { valid: true,  plate: p, kind: '🏍️ Motocicleta' };
  return { valid: false, plate: p, kind: '' };
};

// ── CSS Global ────────────────────────────────────────────────────────────────
export const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
html,body,#root{height:100%;} 
body{background:${T.bg};color:${T.text};font-family:${F.body};font-size:14px;}
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:rgba(0,180,255,.2);border-radius:99px;}
input,select,textarea{background:${T.card2};color:${T.text};border:1px solid ${T.border};
  border-radius:8px;padding:10px 13px;font-family:${F.body};font-size:13px;
  outline:none;transition:border .2s,box-shadow .2s;width:100%;}
input:focus,select:focus,textarea:focus{border-color:${T.blue};box-shadow:0 0 0 3px rgba(0,180,255,.1);}
input::placeholder,textarea::placeholder{color:${T.muted};}
select option{background:${T.card2};}
textarea{resize:vertical;min-height:72px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideR{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes scanL{0%{top:8%}100%{top:88%}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}
@keyframes countUp{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
@keyframes glow{0%,100%{box-shadow:0 0 8px currentColor}50%{box-shadow:0 0 22px currentColor,0 0 40px currentColor}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
.fadeUp{animation:fadeUp .35s ease both}
.fadeIn{animation:fadeIn .25s ease both}
.page{animation:fadeUp .3s ease both}
.slideR{animation:slideR .25s ease both}

/* Mobile responsive */
@media(max-width:768px){
  .sidebar{display:none!important}
  .topbar{padding:0 12px!important}
  .main-content{padding:14px!important}
  .stat-grid{grid-template-columns:repeat(2,1fr)!important}
  .chart-grid{grid-template-columns:1fr!important}
  .hide-mobile{display:none!important}
}
@media(max-width:480px){
  .stat-grid{grid-template-columns:1fr!important}
}
`;
