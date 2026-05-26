import { useState, useEffect } from "react";
import { T, F } from "../utils";
import { PrimaryBtn } from "./UI";
import * as API from "../api";
export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [err,   setErr]   = useState('');
  const [loading, setL]   = useState(false);
  const [showPw, setSP]   = useState(false);
  const [locked, setLK]   = useState(false);
  const [timeLeft, setTL] = useState(0);
  const [attempts, setAt] = useState(0);
  const [shaking, setSH]  = useState(false);
  useEffect(() => {
    if (!locked) return;
    const t = setInterval(() => setTL(p => { if (p <= 1) { setLK(false); setErr(''); clearInterval(t); return 0; } return p - 1; }), 1000);
    return () => clearInterval(t);
  }, [locked]);
  const fill = (e, p) => { setEmail(e); setPass(p); setErr(''); setAt(0); };
  const submit = async () => {
    if (locked || loading) return;
    setL(true); setErr('');
    try {
      const d = await API.auth.login(email, pass);
      onLogin(d.user, d.token, d.refresh);
    } catch (e) {
      if (e.locked) { setLK(true); setTL(e.seconds || 300); setErr(e.error); }
      else { setAt(e.attempts || 0); setErr(e.error || 'Error de conexión'); }
      setSH(true); setTimeout(() => setSH(false), 500);
    } finally { setL(false); }
  };
  return (
    <div style={{ height: '100vh', background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(0,180,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,255,.03) 1px,transparent 1px)`, backgroundSize: '52px 52px' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 65% 55% at 50% 50%,rgba(0,90,200,.1) 0%,transparent 65%)' }} />
      <div className="fadeUp" style={{ width: '100%', maxWidth: 430, background: T.card, border: `1px solid ${T.border}`, borderRadius: 18, padding: 40, position: 'relative', boxShadow: '0 40px 80px rgba(0,0,0,.5)', animation: shaking ? 'shake .45s ease' : undefined }}>
        <div style={{ position: 'absolute', top: 0, left: '5%', right: '5%', height: 2, background: `linear-gradient(90deg,transparent,${T.blue},${T.cyan},${T.green},transparent)`, borderRadius: 99 }} />
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 56, marginBottom: 10, filter: `drop-shadow(0 0 24px rgba(0,180,255,.5))` }}>🛡️</div>
          <div style={{ fontFamily: F.head, fontSize: 30, fontWeight: 700, color: T.head, letterSpacing: 4 }}>PUERTA <span style={{ color: T.blue, textShadow: `0 0 24px ${T.blue}60` }}>SEGURA</span></div>
          <div style={{ fontFamily: F.mono, fontSize: 8.5, color: T.green, letterSpacing: 5.5, marginTop: 5, animation: 'blink 3s infinite' }}>● SISTEMA ACTIVO · v3.0</div>
          <div style={{ fontSize: 11.5, color: T.muted, marginTop: 8, lineHeight: 1.6 }}>Universidad de Cundinamarca<br />Seccional Girardot — Ingeniería de Software</div>
        </div>
        <div style={{ height: 1, background: `linear-gradient(90deg,transparent,${T.border},transparent)`, marginBottom: 24 }} />
        {attempts > 0 && !locked && (
          <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 14 }}>
            {Array.from({ length: 5 }).map((_, i) => <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, transition: 'all .3s', background: i < attempts ? T.red : 'rgba(255,68,68,.1)', boxShadow: i < attempts ? `0 0 5px ${T.red}` : 'none' }} />)}
          </div>
        )}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 10, color: T.muted, letterSpacing: 2.5, fontFamily: F.mono, marginBottom: 6, textTransform: 'uppercase' }}>Correo Institucional</div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ucundinamarca.edu.co" onKeyDown={e => e.key === 'Enter' && submit()} disabled={locked} />
        </div>
        <div style={{ marginBottom: 20, position: 'relative' }}>
          <div style={{ fontSize: 10, color: T.muted, letterSpacing: 2.5, fontFamily: F.mono, marginBottom: 6, textTransform: 'uppercase' }}>Contraseña</div>
          <div style={{ position: 'relative' }}>
            <input type={showPw ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" style={{ paddingRight: 42 }} onKeyDown={e => e.key === 'Enter' && submit()} disabled={locked} />
            <button onClick={() => setSP(!showPw)} style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 15, padding: 4 }}>{showPw ? '🙈' : '👁️'}</button>
          </div>
        </div>
        {err && <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 9, fontSize: 12, textAlign: 'center', lineHeight: 1.5, background: locked ? 'rgba(255,61,61,.07)' : 'rgba(255,140,0,.07)', border: `1px solid ${locked ? T.red : T.orange}30`, color: locked ? T.red : T.orange, fontFamily: F.mono }}>
          {err}{locked && <div style={{ fontSize: 26, fontWeight: 700, marginTop: 8, letterSpacing: 3 }}>{String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}</div>}
        </div>}
        <PrimaryBtn onClick={submit} disabled={locked} loading={loading} full>{locked ? '🔒 CUENTA BLOQUEADA' : '→ INGRESAR AL SISTEMA'}</PrimaryBtn>
        <div style={{ marginTop: 22, padding: 14, background: 'rgba(0,180,255,.03)', border: `1px solid ${T.border}`, borderRadius: 10 }}>
          <div style={{ fontSize: 9, color: T.muted, letterSpacing: 3, fontFamily: F.mono, marginBottom: 10 }}>▸ ACCESOS DEMO</div>
          {[{ icon: '🔑', role: 'Administrador', e: 'admin@ucundinamarca.edu.co', p: 'Admin2026!' }, { icon: '👁️', role: 'Vigilante', e: 'vigilante@ucundinamarca.edu.co', p: 'Vigil2026!' }].map(u => (
            <button key={u.e} onClick={() => fill(u.e, u.p)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', marginBottom: 6, padding: '8px 12px', textAlign: 'left', background: T.card2, border: `1px solid ${T.border}`, borderRadius: 8, color: T.muted, cursor: 'pointer', transition: 'all .18s' }}
              onMouseOver={e => { e.currentTarget.style.borderColor = T.blue; e.currentTarget.style.color = T.text; }} onMouseOut={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.muted; }}>
              <span style={{ fontSize: 15 }}>{u.icon}</span>
              <div><div style={{ color: T.text, fontWeight: 600, fontSize: 12, marginBottom: 1 }}>{u.role}</div><div style={{ fontSize: 10 }}>{u.e} · {u.p}</div></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
