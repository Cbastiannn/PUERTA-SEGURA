import { useState, useEffect, useRef } from "react";
import { T, F } from "../utils";
export default function CommandPalette({ onClose, onNavigate, nav }) {
  const [q, setQ] = useState('');
  const ref = useRef(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const results = q.trim() ? nav.filter(n => n.label.toLowerCase().includes(q.toLowerCase())) : nav;
  return (
    <div className="fadeIn" onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', zIndex: 800, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '15vh', backdropFilter: 'blur(8px)' }}>
      <div className="fadeUp" style={{ width: '100%', maxWidth: 520, background: T.card, border: `1px solid ${T.borderHov}`, borderRadius: 14, overflow: 'hidden', boxShadow: `0 40px 80px rgba(0,0,0,.6)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
          <span style={{ color: T.muted }}>⌘</span>
          <input ref={ref} value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar módulo..."
            style={{ background: 'transparent', border: 'none', flex: 1, fontSize: 15, color: T.text, outline: 'none', padding: 0 }}
            onKeyDown={e => { if (e.key === 'Escape') onClose(); if (e.key === 'Enter' && results[0]) { onNavigate(results[0].id); onClose(); } }} />
          <span style={{ fontFamily: F.mono, fontSize: 9, color: T.muted, background: 'rgba(255,255,255,.05)', padding: '3px 7px', borderRadius: 4 }}>ESC</span>
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto', padding: 8 }}>
          {results.map(n => (
            <div key={n.id} onClick={() => { onNavigate(n.id); onClose(); }}
              style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '11px 14px', borderRadius: 8, cursor: 'pointer', transition: 'background .15s' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(0,180,255,.08)'}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{n.icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: T.head }}>{n.label}</span>
              <span style={{ marginLeft: 'auto', fontFamily: F.mono, fontSize: 9, color: T.muted, background: 'rgba(255,255,255,.04)', padding: '3px 8px', borderRadius: 5 }}>Enter</span>
            </div>
          ))}
        </div>
        <div style={{ padding: '9px 18px', borderTop: `1px solid ${T.border}`, fontFamily: F.mono, fontSize: 10, color: T.muted, display: 'flex', gap: 14 }}>
          <span>↵ abrir</span><span>Esc cerrar</span><span style={{ marginLeft: 'auto' }}>Ctrl+K</span>
        </div>
      </div>
    </div>
  );
}
