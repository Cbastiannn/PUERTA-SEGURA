// src/components/UI/ErrorBoundary.jsx
// Captura errores de React y muestra pantalla amigable
import { Component } from "react";
import { T, F } from "../../utils";

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: 40, textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 16, opacity: .4 }}>⚠️</div>
        <div style={{ fontFamily: F.head, fontSize: 22, fontWeight: 700, color: T.head, marginBottom: 10 }}>Error inesperado en este módulo</div>
        <div style={{ fontSize: 13, color: T.muted, marginBottom: 24, maxWidth: 400, lineHeight: 1.6 }}>
          Ocurrió un error en la interfaz. Los demás módulos siguen funcionando.
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 10, color: T.red, background: 'rgba(255,61,61,.06)', border: `1px solid ${T.red}25`, borderRadius: 8, padding: '10px 16px', maxWidth: 500, wordBreak: 'break-all', marginBottom: 24 }}>
          {this.state.error?.message || 'Error desconocido'}
        </div>
        <button
          onClick={() => this.setState({ hasError: false, error: null })}
          style={{ background: T.blue, color: '#000', border: 'none', borderRadius: 8, padding: '10px 22px', fontFamily: F.head, fontWeight: 700, fontSize: 14, cursor: 'pointer', letterSpacing: .5 }}>
          ↺ Reintentar
        </button>
      </div>
    );
  }
}

// ── Backend status monitor ────────────────────────────────────────────────────
// Muestra banner cuando el servidor no responde
import { useState, useEffect, useCallback } from "react";

export function BackendStatus() {
  const [status, setStatus] = useState('ok'); // 'ok' | 'slow' | 'down'
  const [retrying, setRetrying] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const check = useCallback(async () => {
    const start = Date.now();
    try {
      const res = await fetch('/api/stats/', {
        signal: AbortSignal.timeout(5000),
        headers: { 'Cache-Control': 'no-cache' },
      });
      const ms = Date.now() - start;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setAttempts(0);
      setStatus(ms > 2000 ? 'slow' : 'ok');
    } catch {
      setAttempts(p => p + 1);
      setStatus('down');
    }
  }, []);

  useEffect(() => {
    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [check]);

  const retry = async () => {
    setRetrying(true);
    await check();
    setRetrying(false);
  };

  if (status === 'ok') return null;

  const isDown = status === 'down';
  const color  = isDown ? T.red : T.orange;
  const msg    = isDown
    ? `⚠️ Backend inaccesible (${attempts} intento${attempts !== 1 ? 's' : ''})`
    : '🐢 El servidor está respondiendo lento';

  return (
    <div style={{
      position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)',
      background: `${color}12`, border: `1px solid ${color}40`,
      borderRadius: 10, padding: '10px 18px', zIndex: 800,
      display: 'flex', alignItems: 'center', gap: 12,
      backdropFilter: 'blur(12px)', boxShadow: `0 8px 24px ${color}20`,
      fontFamily: F.mono, fontSize: 12, color,
      animation: 'slideR .3s ease',
    }}>
      <span style={{ animation: isDown ? 'blink 1.2s infinite' : 'none' }}>
        {isDown ? '●' : '◐'}
      </span>
      <span>{msg}</span>
      {isDown && (
        <button
          onClick={retry}
          disabled={retrying}
          style={{ background: `${color}20`, border: `1px solid ${color}40`, borderRadius: 6, color, fontFamily: F.mono, fontSize: 11, padding: '4px 10px', cursor: retrying ? 'wait' : 'pointer', transition: 'all .2s' }}>
          {retrying ? '...' : '↺ Reintentar'}
        </button>
      )}
    </div>
  );
}

// ── ConfirmDialog — reemplaza window.confirm ─────────────────────────────────
// Uso: const { confirm, ConfirmDialog } = useConfirm()
//      await confirm({ title, msg, danger })

export function useConfirm() {
  const [state, setState] = useState(null); // { title, msg, danger, resolve }

  const confirm = useCallback(({ title = '¿Confirmar acción?', msg = '', danger = false } = {}) => {
    return new Promise(resolve => setState({ title, msg, danger, resolve }));
  }, []);

  const handle = useCallback((result) => {
    state?.resolve(result);
    setState(null);
  }, [state]);

  const ConfirmDialog = state ? (
    <div className="fadeIn"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 700, backdropFilter: 'blur(6px)' }}>
      <div className="fadeUp"
        style={{ background: T.card, border: `1px solid ${state.danger ? T.red + '44' : T.borderHov}`, borderRadius: 14, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 40px 80px rgba(0,0,0,.65)', textAlign: 'center' }}>
        {/* Top accent line */}
        <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${state.danger ? T.red : T.blue},transparent)`, borderRadius: 99, marginBottom: 22 }} />
        <div style={{ fontSize: 44, marginBottom: 14 }}>{state.danger ? '⚠️' : '❓'}</div>
        <div style={{ fontFamily: F.head, fontSize: 18, fontWeight: 700, color: T.head, marginBottom: state.msg ? 10 : 22 }}>{state.title}</div>
        {state.msg && <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6, marginBottom: 22 }}>{state.msg}</div>}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={() => handle(false)}
            style={{ flex: 1, padding: '10px 18px', background: 'rgba(255,255,255,.05)', border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, fontFamily: F.head, fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all .15s' }}
            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,.08)'}
            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,.05)'}>
            Cancelar
          </button>
          <button
            onClick={() => handle(true)}
            style={{ flex: 1, padding: '10px 18px', background: state.danger ? T.red : T.blue, border: 'none', borderRadius: 8, color: '#000', fontFamily: F.head, fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all .2s', boxShadow: `0 4px 16px ${state.danger ? T.red : T.blue}40` }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={e => e.currentTarget.style.transform = ''}>
            {state.danger ? '🗑️ Confirmar' : '✓ Aceptar'}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirm, ConfirmDialog };
}
