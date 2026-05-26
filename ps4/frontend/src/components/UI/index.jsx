// src/components/UI/index.jsx — Componentes UI reutilizables
import { useEffect, useRef } from "react";
import { T, F } from "../../utils";
import { useCountUp } from "../../hooks";

// ── Label ─────────────────────────────────────────────────────────────────────
export const Lbl = ({ c }) => (
  <div style={{ fontSize: 10, color: T.muted, letterSpacing: 2.5, fontFamily: F.mono, marginBottom: 6, textTransform: 'uppercase' }}>{c}</div>
);

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ color = T.blue, bg, size = 11, children }) {
  return (
    <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: size, background: bg || `${color}16`, color, border: `1px solid ${color}30`, fontFamily: F.mono, letterSpacing: .3, whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Btn({ onClick, color = T.blue, bg, children, disabled, sm, full, style = {}, title }) {
  const sz = sm ? { padding: '6px 11px', fontSize: 12 } : { padding: '9px 18px', fontSize: 13 };
  return (
    <button title={title} onClick={onClick} disabled={disabled}
      style={{ ...sz, borderRadius: 7, cursor: disabled ? 'not-allowed' : 'pointer', border: `1px solid ${color}35`, background: bg || `${color}14`, color, fontFamily: F.head, fontWeight: 700, opacity: disabled ? .4 : 1, transition: 'all .15s', width: full ? '100%' : undefined, letterSpacing: .3, ...style }}
      onMouseOver={e => { if (!disabled) e.currentTarget.style.background = bg ? `${bg}dd` : `${color}28`; }}
      onMouseOut={e => { e.currentTarget.style.background = bg || `${color}14`; }}>
      {children}
    </button>
  );
}

// ── Primary Button ────────────────────────────────────────────────────────────
export function PrimaryBtn({ onClick, children, disabled, loading, color = T.blue, full, sm }) {
  const sz = sm ? { padding: '7px 14px', fontSize: 12 } : { padding: '10px 22px', fontSize: 14 };
  return (
    <button onClick={onClick} disabled={disabled || loading}
      style={{ ...sz, borderRadius: 8, cursor: (disabled || loading) ? 'not-allowed' : 'pointer', border: 'none', background: color, color: '#000', fontFamily: F.head, fontWeight: 700, opacity: (disabled || loading) ? .55 : 1, transition: 'all .2s', width: full ? '100%' : undefined, letterSpacing: .5, boxShadow: `0 4px 18px ${color}40` }}
      onMouseOver={e => { if (!disabled && !loading) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = `0 6px 26px ${color}60`; } }}
      onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 18px ${color}40`; }}>
      {loading ? '⏳ Procesando...' : children}
    </button>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 20, color = T.blue }) {
  return <div style={{ width: size, height: size, border: `2px solid ${color}25`, borderTopColor: color, borderRadius: '50%', animation: 'spin .65s linear infinite', flexShrink: 0 }} />;
}

// ── Empty state ───────────────────────────────────────────────────────────────
export function Empty({ icon = '📭', msg = 'Sin resultados' }) {
  return (
    <div style={{ padding: '44px 20px', textAlign: 'center' }}>
      <div style={{ fontSize: 40, opacity: .2, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 12, color: T.muted, fontFamily: F.mono }}>{msg}</div>
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, glow, onClick, p = 0 }) {
  return (
    <div onClick={onClick}
      style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: glow ? `0 0 20px rgba(0,180,255,.15)` : 'none', transition: 'all .2s', padding: p || undefined, cursor: onClick ? 'pointer' : undefined, ...style }}
      onMouseOver={e => { if (onClick) { e.currentTarget.style.borderColor = T.borderHov; e.currentTarget.style.boxShadow = `0 4px 16px rgba(0,180,255,.1)`; } }}
      onMouseOut={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.boxShadow = glow ? `0 0 20px rgba(0,180,255,.15)` : 'none'; }}>
      {children}
    </div>
  );
}

// ── Stat Card with animated counter ──────────────────────────────────────────
export function StatCard({ label, value, sub, color, icon, pct, onClick }) {
  const counted = useCountUp(typeof value === 'number' ? value : 0);
  return (
    <div onClick={onClick}
      className="fadeUp"
      style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '18px 16px', borderBottom: `3px solid ${color}`, position: 'relative', overflow: 'hidden', transition: 'all .2s', cursor: onClick ? 'pointer' : undefined }}
      onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}20`; e.currentTarget.style.borderColor = color; }}
      onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = T.border; }}>
      <div style={{ position: 'absolute', right: 12, top: 10, fontSize: 28, opacity: .08 }}>{icon}</div>
      <div style={{ fontFamily: F.mono, fontSize: 9, color: T.muted, letterSpacing: 2, marginBottom: 10 }}>{label}</div>
      <div style={{ fontFamily: F.head, fontSize: 44, fontWeight: 700, color, lineHeight: 1, animation: 'countUp .5s ease' }}>{counted}</div>
      {sub && <div style={{ fontSize: 11, color: T.muted, marginTop: 6 }}>{sub}</div>}
      {pct !== undefined && (
        <div style={{ fontSize: 10, color: pct >= 0 ? T.green : T.red, marginTop: 4, fontFamily: F.mono }}>
          {pct >= 0 ? '↑' : '↓'} {Math.abs(pct)}% vs ayer
        </div>
      )}
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ children, onClose, title, width = 520 }) {
  useEffect(() => {
    const fn = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  return (
    <div className="fadeIn" onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 600, padding: 20, backdropFilter: 'blur(6px)' }}>
      <div className="fadeUp" style={{ background: T.card, border: `1px solid ${T.borderHov}`, borderRadius: 14, padding: 28, width: '100%', maxWidth: width, position: 'relative', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 40px 80px rgba(0,0,0,.65)' }}>
        <div style={{ position: 'absolute', top: 0, left: '8%', right: '8%', height: 1.5, background: `linear-gradient(90deg,transparent,${T.blue},${T.cyan},transparent)`, borderRadius: 99 }} />
        {title && <div style={{ fontFamily: F.head, fontSize: 19, fontWeight: 700, color: T.head, marginBottom: 20, paddingBottom: 14, borderBottom: `1px solid ${T.border}` }}>{title}</div>}
        <button onClick={onClose}
          style={{ position: 'absolute', top: 14, right: 14, width: 28, height: 28, background: 'rgba(255,255,255,.05)', border: 'none', color: T.muted, fontSize: 16, cursor: 'pointer', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,68,68,.15)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}>✕</button>
        {children}
      </div>
    </div>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
const TH = ({ c, w, sortable, onSort, sortIndicator }) => (
  <th onClick={sortable ? onSort : undefined}
    style={{ textAlign: 'left', padding: '11px 14px', fontSize: 10, color: T.muted, letterSpacing: 2, fontFamily: F.mono, borderBottom: `1px solid ${T.border}`, whiteSpace: 'nowrap', width: w, cursor: sortable ? 'pointer' : undefined, userSelect: 'none', transition: 'color .15s' }}
    onMouseOver={e => { if (sortable) e.currentTarget.style.color = T.blue; }}
    onMouseOut={e => { e.currentTarget.style.color = T.muted; }}>
    {c}{sortable && <span style={{ opacity: .5 }}>{sortIndicator}</span>}
  </th>
);
const TD = ({ children, s = {} }) => <td style={{ padding: '10px 14px', borderBottom: `1px solid ${T.border}`, ...s }}>{children}</td>;

export function Table({ heads, rows, loading, empty, pagination, onPage }) {
  return (
    <Card>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: heads.length * 90 }}>
          <thead>
            <tr style={{ background: 'rgba(0,180,255,.03)' }}>
              {heads.map((h, i) => <TH key={i} c={h.c} w={h.w} sortable={h.sortable} onSort={h.onSort} sortIndicator={h.sortIndicator} />)}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{heads.map((_, j) => <td key={j} style={{ padding: '11px 14px', borderBottom: `1px solid ${T.border}` }}><div style={{ height: 12, borderRadius: 3, background: 'rgba(255,255,255,.04)', animation: 'pulse 1.8s infinite' }} /></td>)}</tr>
              ))
              : rows.length === 0
                ? <tr><td colSpan={heads.length}>{empty || <Empty />}</td></tr>
                : rows
            }
          </tbody>
        </table>
      </div>
      {pagination && pagination.total_pages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.muted }}>{pagination.count} registros · Pág. {pagination.page}/{pagination.total_pages}</div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[['«', 1], ['‹', pagination.page - 1]].map(([l, p]) => (
              <Btn key={l} sm onClick={() => onPage(p)} disabled={pagination.page <= 1}>{l}</Btn>
            ))}
            {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
              const p = Math.max(1, Math.min(pagination.total_pages - 4, pagination.page - 2)) + i;
              return p <= pagination.total_pages ? (
                <Btn key={p} sm onClick={() => onPage(p)}
                  bg={p === pagination.page ? T.blue : undefined}
                  color={p === pagination.page ? '#000' : T.blue}>{p}</Btn>
              ) : null;
            })}
            {[['›', pagination.page + 1], ['»', pagination.total_pages]].map(([l, p]) => (
              <Btn key={l} sm onClick={() => onPage(p)} disabled={pagination.page >= pagination.total_pages}>{l}</Btn>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

// ── Table row helpers (re-exportados para uso en módulos) ─────────────────────
export { TH, TD };

// ── Toast renderer ────────────────────────────────────────────────────────────
export function Toasts({ items }) {
  const TC = { success: T.green, error: T.red, info: T.blue, warning: T.orange };
  return (
    <div style={{ position: 'fixed', top: 14, right: 14, zIndex: 900, display: 'flex', flexDirection: 'column', gap: 7, pointerEvents: 'none' }}>
      {items.map(t => (
        <div key={t.id} className="slideR" style={{ padding: '11px 16px', borderRadius: 9, maxWidth: 340, background: `${TC[t.type]}12`, border: `1px solid ${TC[t.type]}35`, color: TC[t.type], fontFamily: F.mono, fontSize: 11, backdropFilter: 'blur(12px)', boxShadow: `0 6px 20px ${TC[t.type]}18`, lineHeight: 1.5 }}>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// Re-exports from ErrorBoundary module
export { ErrorBoundary, BackendStatus, useConfirm } from './ErrorBoundary';
