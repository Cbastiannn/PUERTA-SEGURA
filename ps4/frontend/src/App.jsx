import { useState, useEffect, useCallback, useRef } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import { useToast, useKey } from "./hooks";
import { T, F, fmtTime } from "./utils";
import { Toasts } from "./components/UI";
import { ErrorBoundary, BackendStatus } from "./components/UI/ErrorBoundary";
import * as API from "./api";

import Dashboard   from "./components/Dashboard";
import Vehicles    from "./components/Vehicles";
import History     from "./components/History";
import Blacklist   from "./components/Blacklist";
import Visitors    from "./components/Visitors";
import Reports     from "./components/Reports";
import Audit       from "./components/Audit";
import CommandPalette from "./components/CommandPalette";
import NotifPanel     from "./components/NotifPanel";
import Sidebar        from "./components/Sidebar";

// ── CSS Global ─────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=IBM+Plex+Sans:wght@300;400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{background:#04090f;color:#d4ecff;font-family:'IBM Plex Sans',sans-serif;}
::-webkit-scrollbar{width:4px;height:4px;}
::-webkit-scrollbar-thumb{background:rgba(0,180,255,.2);border-radius:99px;}
input,select,textarea{background:#0c1824;color:#d4ecff;border:1px solid rgba(0,180,255,.1);border-radius:8px;padding:10px 13px;font-family:'IBM Plex Sans',sans-serif;font-size:13px;outline:none;transition:border .2s;width:100%;}
input:focus,select:focus{border-color:#00b4ff;box-shadow:0 0 0 3px rgba(0,180,255,.1);}
input::placeholder,textarea::placeholder{color:#5a7d99;}
select option{background:#0c1824;}
textarea{resize:vertical;min-height:72px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes slideR{from{opacity:0;transform:translateX(18px)}to{opacity:1;transform:none}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes scanL{0%{top:8%}100%{top:88%}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes glow{0%,100%{box-shadow:0 0 8px currentColor}50%{box-shadow:0 0 22px currentColor}}
@keyframes shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}
.fadeUp{animation:fadeUp .35s ease both}
.fadeIn{animation:fadeIn .25s ease both}
.page{animation:fadeUp .3s ease both}
`;

// ── LANDING PAGE ────────────────────────────────────────────────
function LandingPage({ onEstudiante, onVigilante }) {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  return (
    <div style={{ minHeight:'100vh', background:'#04090f', color:'#d4ecff', fontFamily:"'IBM Plex Sans',sans-serif", overflowY:'auto' }}>
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, background:'rgba(4,9,15,.95)', backdropFilter:'blur(14px)', borderBottom:'1px solid rgba(0,180,255,.1)', height:64, display:'flex', alignItems:'center' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'0 24px', width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => scrollTo('inicio')}>
            <span style={{ fontSize:26 }}>🛡️</span>
            <div>
              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18, fontWeight:700, color:'#fff', letterSpacing:1 }}>Puerta <span style={{ color:'#00b4ff' }}>Segura</span></div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7, color:'#00ffa3', letterSpacing:3 }}>v3.0 · UCUNDINAMARCA</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {[['inicio','Inicio'],['funciones','Funciones'],['acerca','Acerca de'],['contacto','Contacto']].map(([id,lbl]) => (
              <button key={id} onClick={() => scrollTo(id)} style={{ background:'none', border:'none', color:'#5a7d99', fontFamily:"'IBM Plex Sans',sans-serif", fontSize:14, cursor:'pointer', padding:'8px 14px', borderRadius:8 }}
                onMouseOver={e => { e.currentTarget.style.color='#d4ecff'; e.currentTarget.style.background='rgba(255,255,255,.05)'; }}
                onMouseOut={e => { e.currentTarget.style.color='#5a7d99'; e.currentTarget.style.background='none'; }}>{lbl}</button>
            ))}
            <div style={{ width:1, height:24, background:'rgba(0,180,255,.1)', margin:'0 8px' }}/>
            <button onClick={onEstudiante} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid #00b4ff', background:'transparent', color:'#00b4ff', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer' }}
              onMouseOver={e => e.currentTarget.style.background='rgba(0,180,255,.1)'}
              onMouseOut={e => e.currentTarget.style.background='transparent'}>🎓 Estudiante</button>
            <button onClick={onVigilante} style={{ padding:'9px 18px', borderRadius:8, border:'none', background:'#00b4ff', color:'#000', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', boxShadow:'0 4px 16px rgba(0,180,255,.4)' }}>👁️ Vigilante</button>
          </div>
        </div>
      </nav>

      <section id="inicio" style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'100px 24px 80px', position:'relative' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(0,180,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,255,.04) 1px,transparent 1px)', backgroundSize:'50px 50px' }}/>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(0,90,200,.12) 0%,transparent 70%)' }}/>
        <div style={{ maxWidth:800, textAlign:'center', position:'relative' }}>
          <div style={{ fontSize:80, marginBottom:20 }}>🛡️</div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#00ffa3', letterSpacing:6, marginBottom:16 }}>● SISTEMA ACTIVO · UNIVERSIDAD DE CUNDINAMARCA</div>
          <h1 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:60, fontWeight:700, color:'#fff', lineHeight:1.1, marginBottom:20, letterSpacing:2 }}>PUERTA <span style={{ color:'#00b4ff' }}>SEGURA</span></h1>
          <p style={{ fontSize:18, color:'#5a7d99', lineHeight:1.7, maxWidth:580, margin:'0 auto 40px' }}>
            Sistema inteligente de control de acceso vehicular para la <strong style={{ color:'#d4ecff' }}>Universidad de Cundinamarca, Seccional Girardot</strong>.
          </p>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginBottom:60 }}>
            <button onClick={onEstudiante} style={{ padding:'14px 32px', borderRadius:10, border:'2px solid #00b4ff', background:'transparent', color:'#00b4ff', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:16, cursor:'pointer', letterSpacing:1 }}
              onMouseOver={e => { e.currentTarget.style.background='rgba(0,180,255,.1)'; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseOut={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.transform=''; }}>🎓 Soy Estudiante</button>
            <button onClick={onVigilante} style={{ padding:'14px 32px', borderRadius:10, border:'none', background:'#00b4ff', color:'#000', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:16, cursor:'pointer', letterSpacing:1, boxShadow:'0 6px 28px rgba(0,180,255,.5)' }}
              onMouseOver={e => e.currentTarget.style.transform='translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform=''}>👁️ Soy Vigilante</button>
          </div>
          <div style={{ display:'flex', gap:40, justifyContent:'center', flexWrap:'wrap' }}>
            {[['12+','Funcionalidades'],['100%','Trazabilidad'],['24/7','Disponible'],['v3.0','Versión']].map(([n,l],i) => (
              <div key={i} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:32, fontWeight:700, color:'#00b4ff' }}>{n}</div>
                <div style={{ fontSize:12, color:'#5a7d99', fontFamily:"'IBM Plex Mono',monospace" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="funciones" style={{ padding:'80px 24px', background:'#080f18' }}>
        <div style={{ maxWidth:1100, margin:'0 auto' }}>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#00b4ff', letterSpacing:4, marginBottom:12 }}>FUNCIONALIDADES</div>
            <h2 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:38, fontWeight:700, color:'#fff' }}>Todo lo que necesitas</h2>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:20 }}>
            {[['📱','Código QR Inteligente','SHA-256 único por vehículo. Vigente 365 días y enviado al correo automáticamente.'],
              ['📷','Escaneo con Cámara Real','Detecta el QR con la cámara del dispositivo. Respuesta instantánea con feedback sonoro.'],
              ['🚗','Registro de Vehículos','Placas colombianas ABC123 y ABC12D validadas automáticamente.'],
              ['🚫','Lista Negra','Vehículos bloqueados con alertas en tiempo real.'],
              ['📊','Dashboard en Tiempo Real','Gráficas y estadísticas actualizadas al instante.'],
              ['📋','Historial Completo','Exportable a Excel, CSV y PDF con filtros avanzados.'],
              ['👥','Control de Visitantes','Registro de entrada y salida con alertas de permanencia.'],
              ['🔒','Seguridad','Tokens JWT seguros con bloqueo automático tras intentos fallidos.'],
              ['📈','Reportes Ejecutivos','Por rango de fechas con análisis de autorización.'],
            ].map(([icon,title,desc],i) => (
              <div key={i} style={{ background:'#04090f', border:'1px solid rgba(0,180,255,.1)', borderRadius:12, padding:'24px 20px', transition:'all .2s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor='rgba(0,180,255,.35)'; e.currentTarget.style.transform='translateY(-3px)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor='rgba(0,180,255,.1)'; e.currentTarget.style.transform=''; }}>
                <div style={{ fontSize:36, marginBottom:14 }}>{icon}</div>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:17, fontWeight:700, color:'#fff', marginBottom:8 }}>{title}</div>
                <div style={{ fontSize:13, color:'#5a7d99', lineHeight:1.6 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="acerca" style={{ padding:'80px 24px' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#00b4ff', letterSpacing:4, marginBottom:12 }}>ACERCA DE</div>
          <h2 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:38, fontWeight:700, color:'#fff', marginBottom:16 }}>¿Qué es Puerta Segura?</h2>
          <p style={{ color:'#5a7d99', fontSize:15, lineHeight:1.8, maxWidth:700, margin:'0 auto 40px' }}>
            Sistema académico desarrollado por estudiantes de <strong style={{ color:'#d4ecff' }}>Ingeniería de Software</strong> de la Universidad de Cundinamarca para modernizar el control de acceso vehicular del campus.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16, maxWidth:900, margin:'0 auto 32px' }}>
            {[['👨‍💻','Sebastián D. Uribe C.','Desarrollador Backend & Arquitectura'],
              ['👨‍💻','Andrés F. Castañeda','Desarrollador Frontend & UX'],
              ['🏫','Universidad de Cundinamarca','Seccional Girardot · Ingeniería de Software · 2026'],
            ].map(([icon,name,role],i) => (
              <div key={i} style={{ background:'#080f18', border:'1px solid rgba(0,180,255,.1)', borderRadius:12, padding:'20px 22px', display:'flex', alignItems:'center', gap:16 }}>
                <div style={{ fontSize:36, flexShrink:0 }}>{icon}</div>
                <div style={{ textAlign:'left' }}>
                  <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16, fontWeight:700, color:'#fff' }}>{name}</div>
                  <div style={{ fontSize:12, color:'#5a7d99', marginTop:4 }}>{role}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', justifyContent:'center' }}>
            {['Django 4.2','React 18','MySQL 8.0','JWT','WebSockets','Celery','jsQR'].map(t => (
              <span key={t} style={{ padding:'6px 14px', borderRadius:99, background:'rgba(0,180,255,.1)', border:'1px solid rgba(0,180,255,.25)', color:'#00b4ff', fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>{t}</span>
            ))}
          </div>
        </div>
      </section>

      <section id="contacto" style={{ padding:'80px 24px', background:'#080f18' }}>
        <div style={{ maxWidth:600, margin:'0 auto', textAlign:'center' }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#00b4ff', letterSpacing:4, marginBottom:12 }}>CONTACTO</div>
          <h2 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:38, fontWeight:700, color:'#fff', marginBottom:16 }}>¿Tienes preguntas?</h2>
          <p style={{ color:'#5a7d99', fontSize:15, lineHeight:1.7, marginBottom:40 }}>Para soporte o información contacta al equipo de desarrollo.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:12, marginBottom:40 }}>
            {[['📧','Correo','sduribe@ucundinamarca.edu.co'],['🏫','Universidad','Universidad de Cundinamarca, Seccional Girardot'],['💻','Programa','Ingeniería de Software']].map(([icon,lbl,val],i) => (
              <div key={i} style={{ background:'#04090f', border:'1px solid rgba(0,180,255,.1)', borderRadius:10, padding:'14px 18px', display:'flex', alignItems:'center', gap:14, textAlign:'left' }}>
                <span style={{ fontSize:22, flexShrink:0 }}>{icon}</span>
                <div>
                  <div style={{ fontSize:10, color:'#5a7d99', fontFamily:"'IBM Plex Mono',monospace", marginBottom:3 }}>{lbl}</div>
                  <div style={{ fontSize:14, color:'#d4ecff' }}>{val}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={onEstudiante} style={{ padding:'13px 28px', borderRadius:9, border:'2px solid #00b4ff', background:'transparent', color:'#00b4ff', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:15, cursor:'pointer' }}
              onMouseOver={e => e.currentTarget.style.background='rgba(0,180,255,.1)'}
              onMouseOut={e => e.currentTarget.style.background='transparent'}>🎓 Acceso Estudiante</button>
            <button onClick={onVigilante} style={{ padding:'13px 28px', borderRadius:9, border:'none', background:'#00b4ff', color:'#000', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:15, cursor:'pointer' }}>👁️ Acceso Vigilante</button>
          </div>
        </div>
      </section>

      <footer style={{ padding:'24px', borderTop:'1px solid rgba(0,180,255,.1)', textAlign:'center' }}>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#5a7d99' }}>🛡️ Puerta Segura v3.0 · Universidad de Cundinamarca · 2026</div>
      </footer>
    </div>
  );
}

// ── LOGIN ESTUDIANTE (con opción crear cuenta) ──────────────────
function LoginEstudiante({ onBack, onSuccess }) {
  const [modo, setModo]   = useState('login'); // 'login' | 'registro'
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApe]  = useState('');
  const [pass2, setPass2]   = useState('');
  const [err,   setErr]   = useState('');
  const [loading, setL]   = useState(false);

  const login = async () => {
    if (!email || !pass) { setErr('Completa todos los campos'); return; }
    setL(true); setErr('');
    try {
      const d = await API.auth.login(email, pass);
      API.setToken(d.token); API.setRefresh(d.refresh); API.setUser(d.user);
      localStorage.setItem('ps_token', d.token);
      localStorage.setItem('ps_user', JSON.stringify(d.user));
      onSuccess(d.user);
    } catch (e) { setErr(e.error || 'Credenciales incorrectas'); }
    finally { setL(false); }
  };

  const registrar = async () => {
    if (!nombre || !apellido || !email || !pass) { setErr('Completa todos los campos'); return; }
    if (pass !== pass2) { setErr('Las contraseñas no coinciden'); return; }
    if (pass.length < 8) { setErr('Mínimo 8 caracteres'); return; }
    setL(true); setErr('');
    try {
      // Usar endpoint público de registro de estudiantes
      const d = await API.auth.registro({
        first_name: nombre,
        last_name: apellido,
        email,
        password: pass,
      });
      API.setToken(d.token); API.setRefresh(d.refresh); API.setUser(d.user);
      localStorage.setItem('ps_token', d.token);
      localStorage.setItem('ps_user', JSON.stringify(d.user));
      onSuccess(d.user);
    } catch (e) { setErr(e.error || 'Error al crear cuenta. Verifica que el correo no esté registrado.'); }
    finally { setL(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#04090f', display:'flex', alignItems:'center', justifyContent:'center', padding:20, position:'relative' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(0,180,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,255,.03) 1px,transparent 1px)', backgroundSize:'50px 50px' }}/>
      <button onClick={onBack} style={{ position:'absolute', top:20, left:20, background:'none', border:'1px solid rgba(0,180,255,.1)', borderRadius:8, color:'#5a7d99', padding:'8px 16px', cursor:'pointer', fontSize:13 }}>← Volver</button>

      <div style={{ width:'100%', maxWidth:440, background:'#080f18', border:'1px solid rgba(0,180,255,.2)', borderRadius:16, padding:36, position:'relative' }}>
        <div style={{ position:'absolute', top:0, left:'5%', right:'5%', height:2, background:'linear-gradient(90deg,transparent,#00b4ff,transparent)', borderRadius:99 }}/>

        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ fontSize:48, marginBottom:10 }}>🎓</div>
          <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:22, fontWeight:700, color:'#fff', marginBottom:6 }}>Portal Estudiante</div>
        </div>

        {/* Tabs login / registro */}
        <div style={{ display:'flex', background:'#0c1824', borderRadius:10, padding:3, marginBottom:24 }}>
          {[['login','Iniciar Sesión'],['registro','Crear Cuenta']].map(([m,lbl]) => (
            <button key={m} onClick={() => { setModo(m); setErr(''); }} style={{ flex:1, padding:'9px', borderRadius:8, border:'none', background:modo===m?'#00b4ff':'transparent', color:modo===m?'#000':'#5a7d99', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', transition:'all .2s' }}>{lbl}</button>
          ))}
        </div>

        {modo === 'login' ? (
          <>
            <div style={{ marginBottom:13 }}>
              <div style={{ fontSize:10, color:'#5a7d99', letterSpacing:2.5, fontFamily:"'IBM Plex Mono',monospace", marginBottom:6, textTransform:'uppercase' }}>Correo</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ucundinamarca.edu.co" onKeyDown={e => e.key==='Enter'&&login()}/>
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:10, color:'#5a7d99', letterSpacing:2.5, fontFamily:"'IBM Plex Mono',monospace", marginBottom:6, textTransform:'uppercase' }}>Contraseña</div>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key==='Enter'&&login()}/>
            </div>
            {err && <div style={{ marginBottom:14, padding:'10px 14px', background:'rgba(255,61,61,.08)', border:'1px solid rgba(255,61,61,.3)', borderRadius:8, fontSize:12, color:'#ff3d3d', textAlign:'center' }}>{err}</div>}
            <button onClick={login} disabled={loading} style={{ width:'100%', padding:'12px', borderRadius:9, border:'none', background:'#00b4ff', color:'#000', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:15, cursor:loading?'wait':'pointer', boxShadow:'0 4px 18px rgba(0,180,255,.4)', opacity:loading?.6:1 }}>
              {loading?'Verificando...':'→ Ingresar'}
            </button>
            <div style={{ marginTop:16, textAlign:'center', fontSize:13, color:'#5a7d99' }}>
              ¿No tienes cuenta?{' '}
              <button onClick={() => setModo('registro')} style={{ background:'none', border:'none', color:'#00b4ff', cursor:'pointer', fontSize:13, fontWeight:600 }}>Crear cuenta gratis</button>
            </div>
          </>
        ) : (
          <>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:13 }}>
              <div>
                <div style={{ fontSize:10, color:'#5a7d99', letterSpacing:2.5, fontFamily:"'IBM Plex Mono',monospace", marginBottom:6, textTransform:'uppercase' }}>Nombre *</div>
                <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre"/>
              </div>
              <div>
                <div style={{ fontSize:10, color:'#5a7d99', letterSpacing:2.5, fontFamily:"'IBM Plex Mono',monospace", marginBottom:6, textTransform:'uppercase' }}>Apellido *</div>
                <input value={apellido} onChange={e => setApe(e.target.value)} placeholder="Tu apellido"/>
              </div>
            </div>
            <div style={{ marginBottom:13 }}>
              <div style={{ fontSize:10, color:'#5a7d99', letterSpacing:2.5, fontFamily:"'IBM Plex Mono',monospace", marginBottom:6, textTransform:'uppercase' }}>Correo institucional *</div>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="correo@ucundinamarca.edu.co"/>
            </div>
            <div style={{ marginBottom:13 }}>
              <div style={{ fontSize:10, color:'#5a7d99', letterSpacing:2.5, fontFamily:"'IBM Plex Mono',monospace", marginBottom:6, textTransform:'uppercase' }}>Contraseña * (mín. 8)</div>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••"/>
            </div>
            <div style={{ marginBottom:20 }}>
              <div style={{ fontSize:10, color:'#5a7d99', letterSpacing:2.5, fontFamily:"'IBM Plex Mono',monospace", marginBottom:6, textTransform:'uppercase' }}>Confirmar contraseña *</div>
              <input type="password" value={pass2} onChange={e => setPass2(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key==='Enter'&&registrar()}/>
            </div>
            {err && <div style={{ marginBottom:14, padding:'10px 14px', background:'rgba(255,61,61,.08)', border:'1px solid rgba(255,61,61,.3)', borderRadius:8, fontSize:12, color:'#ff3d3d', textAlign:'center' }}>{err}</div>}
            <button onClick={registrar} disabled={loading} style={{ width:'100%', padding:'12px', borderRadius:9, border:'none', background:'#00ffa3', color:'#000', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:15, cursor:loading?'wait':'pointer', opacity:loading?.6:1 }}>
              {loading?'Creando cuenta...':'✓ Crear mi cuenta'}
            </button>
            <div style={{ marginTop:16, textAlign:'center', fontSize:13, color:'#5a7d99' }}>
              ¿Ya tienes cuenta?{' '}
              <button onClick={() => setModo('login')} style={{ background:'none', border:'none', color:'#00b4ff', cursor:'pointer', fontSize:13, fontWeight:600 }}>Iniciar sesión</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── LOGIN VIGILANTE ─────────────────────────────────────────────
function LoginVigilante({ onBack, onSuccess }) {
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [err,   setErr]   = useState('');
  const [loading, setL]   = useState(false);

  const login = async () => {
    if (!email || !pass) { setErr('Completa todos los campos'); return; }
    setL(true); setErr('');
    try {
      const d = await API.auth.login(email, pass);
      API.setToken(d.token); API.setRefresh(d.refresh); API.setUser(d.user);
      localStorage.setItem('ps_token', d.token);
      localStorage.setItem('ps_user', JSON.stringify(d.user));
      onSuccess(d.user);
    } catch (e) { setErr(e.error || 'Credenciales incorrectas'); }
    finally { setL(false); }
  };

  return (
    <div style={{ minHeight:'100vh', background:'#04090f', display:'flex', alignItems:'center', justifyContent:'center', padding:20, position:'relative' }}>
      <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(0,180,255,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,255,.03) 1px,transparent 1px)', backgroundSize:'50px 50px' }}/>
      <button onClick={onBack} style={{ position:'absolute', top:20, left:20, background:'none', border:'1px solid rgba(0,180,255,.1)', borderRadius:8, color:'#5a7d99', padding:'8px 16px', cursor:'pointer', fontSize:13 }}>← Volver</button>
      <div style={{ width:'100%', maxWidth:420, background:'#080f18', border:'1px solid rgba(0,180,255,.2)', borderRadius:16, padding:36, position:'relative' }}>
        <div style={{ position:'absolute', top:0, left:'5%', right:'5%', height:2, background:'linear-gradient(90deg,transparent,#00b4ff,transparent)', borderRadius:99 }}/>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:48, marginBottom:10 }}>👁️</div>
          <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:22, fontWeight:700, color:'#fff', marginBottom:6 }}>Portal Vigilante</div>
          <div style={{ fontSize:13, color:'#5a7d99' }}>Acceso al sistema de control vehicular</div>
        </div>
        <div style={{ marginBottom:13 }}>
          <div style={{ fontSize:10, color:'#5a7d99', letterSpacing:2.5, fontFamily:"'IBM Plex Mono',monospace", marginBottom:6, textTransform:'uppercase' }}>Correo</div>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vigilante@ucundinamarca.edu.co" onKeyDown={e => e.key==='Enter'&&login()}/>
        </div>
        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:10, color:'#5a7d99', letterSpacing:2.5, fontFamily:"'IBM Plex Mono',monospace", marginBottom:6, textTransform:'uppercase' }}>Contraseña</div>
          <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="••••••••" onKeyDown={e => e.key==='Enter'&&login()}/>
        </div>
        {err && <div style={{ marginBottom:14, padding:'10px 14px', background:'rgba(255,61,61,.08)', border:'1px solid rgba(255,61,61,.3)', borderRadius:8, fontSize:12, color:'#ff3d3d', textAlign:'center' }}>{err}</div>}
        <button onClick={login} disabled={loading} style={{ width:'100%', padding:'12px', borderRadius:9, border:'none', background:'#00b4ff', color:'#000', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:15, cursor:loading?'wait':'pointer', boxShadow:'0 4px 18px rgba(0,180,255,.4)', opacity:loading?.6:1 }}>
          {loading?'Verificando...':'→ Ingresar al Sistema'}
        </button>
        <div style={{ marginTop:20, padding:14, background:'rgba(0,180,255,.04)', border:'1px solid rgba(0,180,255,.1)', borderRadius:10 }}>
          <div style={{ fontSize:9, color:'#5a7d99', letterSpacing:2.5, fontFamily:"'IBM Plex Mono',monospace", marginBottom:8 }}>▸ ACCESOS DEMO</div>
          {[['👁️ Vigilante','vigilante@ucundinamarca.edu.co','Vigil2026!']].map(([rol,e,p],i) => (
            <button key={i} onClick={() => { setEmail(e); setPass(p); setErr(''); }} style={{ display:'block', width:'100%', textAlign:'left', padding:'7px 10px', marginBottom:i===0?6:0, background:'#0c1824', border:'1px solid rgba(0,180,255,.1)', borderRadius:7, color:'#5a7d99', cursor:'pointer', fontSize:11, transition:'all .15s' }}
              onMouseOver={e2 => { e2.currentTarget.style.borderColor='#00b4ff'; e2.currentTarget.style.color='#d4ecff'; }}
              onMouseOut={e2 => { e2.currentTarget.style.borderColor='rgba(0,180,255,.1)'; e2.currentTarget.style.color='#5a7d99'; }}>
              {rol} — {e} / {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CONTROL DE ACCESO QR (con reinicio automático) ──────────────
function AccessCtrl({ toast }) {
  const { barrierData, setBD } = useApp();
  const [tab, setTab]       = useState('qr');
  const [scanResult, setSR] = useState(null);
  const [scanning, setScan] = useState(false);
  const [camActive, setCam] = useState(false);
  const [manPlate, setMP]   = useState('');
  const [manResult, setMR]  = useState(null);
  const [outPlate, setOP]   = useState('');
  const [outResult, setOR]  = useState(null);
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef    = useRef(null);
  const processRef = useRef(null);

  // Beep
  const beep = (ok) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = ok ? 880 : 220; osc.type = ok ? 'sine' : 'sawtooth';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (ok ? 0.35 : 0.55));
      osc.start(); osc.stop(ctx.currentTime + (ok ? 0.35 : 0.55));
    } catch {}
  };

  const stopCam = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null; setCam(false);
  }, []);

  // FIX: después de procesar QR, reiniciar cámara automáticamente
  const processQR = useCallback(async (qrCode) => {
    setScan(true); setSR(null);
    try {
      const r = await API.acceso.qr(qrCode);
      setSR(r);
      beep(r.autorizado);
      if (r.autorizado) {
        toast(`✅ Autorizado — ${r.propietario}`, 'success');
        setBD(p => ({ ...p, abierta: true }));
        setTimeout(() => setBD(p => ({ ...p, abierta: false })), 5000);
      } else {
        toast(r.motivo || '❌ Acceso denegado', 'error');
      }
    } catch (e) {
      toast(e.error || 'Error procesando QR', 'error');
    } finally {
      setScan(false);
      // Reiniciar cámara después de 2.5 segundos para seguir escaneando
      setTimeout(() => {
        setSR(null);
        startCamRef.current?.();
      }, 2500);
    }
  }, [toast, setBD]);

  useEffect(() => { processRef.current = processQR; }, [processQR]);

  const loop = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || !window.jsQR || v.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop); return;
    }
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext('2d'); ctx.drawImage(v, 0, 0);
    const code = window.jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
    if (code?.data?.startsWith('PSU-v2-')) {
      stopCam(); processRef.current?.(code.data); return;
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [stopCam]);

  // Ref para poder llamar startCam desde dentro de processQR
  const startCamRef = useRef(null);

  const startCam = useCallback(async () => {
    if (!window.jsQR) {
      const jsQR = await import('jsqr');
      window.jsQR = jsQR.default;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } } });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCam(true);
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      toast(e.name === 'NotAllowedError' ? 'Permiso de cámara denegado' : 'Sin cámara disponible', 'error');
    }
  }, [loop, toast]);

  useEffect(() => { startCamRef.current = startCam; }, [startCam]);
  useEffect(() => () => stopCam(), [stopCam]);

  const doManual = async () => {
    if (!manPlate.trim()) { toast('Ingresa una placa', 'error'); return; }
    try { const r = await API.acceso.placa(manPlate.trim()); setMR(r); beep(r.autorizado); r.autorizado ? toast(`✅ ${r.propietario}`, 'success') : toast(r.motivo, 'error'); }
    catch (e) { toast(e.error || 'Error', 'error'); }
  };

  const doSalida = async () => {
    if (!outPlate.trim()) { toast('Ingresa una placa', 'error'); return; }
    try { const r = await API.acceso.salida(outPlate.trim()); setOR(r); toast(`↙️ Salida registrada`, 'success'); }
    catch (e) { toast(e.error || 'Error', 'error'); }
  };

  const barrier = barrierData.abierta;

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:18 }}>
      <div>
        <div style={{ display:'flex', background:'#080f18', border:'1px solid rgba(0,180,255,.1)', borderRadius:10, padding:3, marginBottom:18, width:'fit-content' }}>
          {[['qr','📷 Escaneo QR'],['manual','⌨️ Manual'],['salida','↙️ Salida']].map(([id,lbl]) => (
            <button key={id} onClick={() => { setTab(id); setSR(null); setMR(null); setOR(null); if(camActive) stopCam(); }}
              style={{ padding:'8px 18px', borderRadius:8, border:'none', cursor:'pointer', background:tab===id?'#00b4ff':'transparent', color:tab===id?'#000':'#5a7d99', fontFamily:"'Rajdhani',sans-serif", fontSize:13, fontWeight:700, transition:'all .2s' }}>{lbl}</button>
          ))}
        </div>

        {/* QR */}
        {tab === 'qr' && (
          <div>
            <div style={{ position:'relative', width:'100%', maxWidth:340, aspectRatio:'1', background:'#000', borderRadius:14, overflow:'hidden', margin:'0 auto 16px', border:`2px solid ${camActive?'#00b4ff':scanResult?.autorizado===true?'#00ffa3':scanResult?.autorizado===false?'#ff3d3d':'rgba(0,180,255,.2)'}`, transition:'all .4s' }}>
              <video ref={videoRef} playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', display:camActive?'block':'none' }}/>
              <canvas ref={canvasRef} style={{ display:'none' }}/>
              {camActive && <div style={{ position:'absolute', left:18, right:18, height:2, background:'linear-gradient(90deg,transparent,#00b4ff,transparent)', boxShadow:'0 0 8px #00b4ff', animation:'scanL 2s linear infinite' }}/>}
              {[[0,0],[0,1],[1,0],[1,1]].map(([r,c],i) => (
                <div key={i} style={{ position:'absolute', width:24, height:24, top:r?'auto':12, bottom:r?12:'auto', left:c?'auto':12, right:c?12:'auto', borderTop:r?'none':`3px solid #00b4ff`, borderBottom:r?`3px solid #00b4ff`:'none', borderLeft:c?'none':`3px solid #00b4ff`, borderRight:c?`3px solid #00b4ff`:'none', pointerEvents:'none' }}/>
              ))}
              <div style={{ position:'absolute', inset:0, display:camActive?'none':'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
                {scanning
                  ? <><div style={{ width:40, height:40, border:'2px solid rgba(0,180,255,.25)', borderTopColor:'#00b4ff', borderRadius:'50%', animation:'spin .65s linear infinite' }}/><div style={{ fontSize:10, color:'#00b4ff', fontFamily:"'IBM Plex Mono',monospace" }}>PROCESANDO...</div></>
                  : scanResult
                    ? <><div style={{ fontSize:56 }}>{scanResult.autorizado?'✅':'❌'}</div><div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:18, fontWeight:700, color:scanResult.autorizado?'#00ffa3':'#ff3d3d' }}>{scanResult.autorizado?'AUTORIZADO':'DENEGADO'}</div><div style={{ fontSize:10, color:'#5a7d99', fontFamily:"'IBM Plex Mono',monospace" }}>Reiniciando cámara...</div></>
                    : <><div style={{ fontSize:38, opacity:.15 }}>📷</div><div style={{ fontSize:10, color:'#5a7d99', fontFamily:"'IBM Plex Mono',monospace", letterSpacing:2 }}>CÁMARA LISTA</div></>
                }
              </div>
            </div>
            <div style={{ display:'flex', gap:9, marginBottom:14 }}>
              {!camActive
                ? <button onClick={startCam} style={{ flex:1, padding:'11px', borderRadius:9, border:'none', background:'#00b4ff', color:'#000', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 4px 16px rgba(0,180,255,.4)' }}>📷 Activar Cámara</button>
                : <button onClick={stopCam} style={{ flex:1, padding:'11px', borderRadius:9, border:'1px solid rgba(255,61,61,.3)', background:'rgba(255,61,61,.08)', color:'#ff3d3d', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:14, cursor:'pointer' }}>■ Detener</button>
              }
            </div>
            {scanResult && !camActive && (
              <div style={{ padding:'14px 18px', background:scanResult.autorizado?'rgba(0,255,163,.06)':'rgba(255,61,61,.06)', border:`1px solid ${scanResult.autorizado?'rgba(0,255,163,.3)':'rgba(255,61,61,.3)'}`, borderRadius:11 }}>
                <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16, fontWeight:700, color:scanResult.autorizado?'#00ffa3':'#ff3d3d', marginBottom:6 }}>{scanResult.motivo||(scanResult.autorizado?'✅ Acceso Autorizado':'❌ Acceso Denegado')}</div>
                {scanResult.vehiculo && <div style={{ fontSize:12, color:'#d4ecff' }}>👤 {scanResult.vehiculo.propietario} — {scanResult.vehiculo.tipo}</div>}
              </div>
            )}
          </div>
        )}

        {/* Manual */}
        {tab === 'manual' && (
          <div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, color:'#5a7d99', letterSpacing:2.5, fontFamily:"'IBM Plex Mono',monospace", marginBottom:6, textTransform:'uppercase' }}>Placa del vehículo</div>
              <input value={manPlate} maxLength={6} style={{ fontSize:26, letterSpacing:7, fontFamily:"'IBM Plex Mono',monospace", textAlign:'center' }}
                onChange={e => { setMP(e.target.value.toUpperCase()); setMR(null); }} onKeyDown={e => e.key==='Enter'&&doManual()} placeholder="ABC123"/>
            </div>
            <button onClick={doManual} style={{ width:'100%', padding:'12px', borderRadius:9, border:'none', background:'#00ffa3', color:'#000', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:15, cursor:'pointer' }}>🔍 VERIFICAR ACCESO</button>
            {manResult && <div style={{ marginTop:13, padding:'13px 16px', background:manResult.autorizado?'rgba(0,255,163,.06)':'rgba(255,61,61,.06)', border:`1px solid ${manResult.autorizado?'rgba(0,255,163,.3)':'rgba(255,61,61,.3)'}`, borderRadius:11 }}>
              <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16, fontWeight:700, color:manResult.autorizado?'#00ffa3':'#ff3d3d' }}>{manResult.motivo||(manResult.autorizado?'✅ Autorizado':'❌ Denegado')}</div>
              {manResult.vehiculo && <div style={{ fontSize:12, color:'#d4ecff', marginTop:6 }}>{manResult.vehiculo.propietario}</div>}
            </div>}
          </div>
        )}

        {/* Salida */}
        {tab === 'salida' && (
          <div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, color:'#5a7d99', letterSpacing:2.5, fontFamily:"'IBM Plex Mono',monospace", marginBottom:6, textTransform:'uppercase' }}>Placa del vehículo</div>
              <input value={outPlate} maxLength={6} style={{ fontSize:26, letterSpacing:7, fontFamily:"'IBM Plex Mono',monospace", textAlign:'center' }}
                onChange={e => { setOP(e.target.value.toUpperCase()); setOR(null); }} onKeyDown={e => e.key==='Enter'&&doSalida()} placeholder="ABC123"/>
            </div>
            <button onClick={doSalida} style={{ width:'100%', padding:'12px', borderRadius:9, border:'none', background:'#00d4c8', color:'#000', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:15, cursor:'pointer' }}>↙️ REGISTRAR SALIDA</button>
            {outResult && <div style={{ marginTop:13, padding:'13px 16px', background:'rgba(0,212,200,.07)', border:'1px solid rgba(0,212,200,.3)', borderRadius:10 }}>
              <div style={{ color:'#00d4c8', fontFamily:"'Rajdhani',sans-serif", fontSize:16, fontWeight:700 }}>✅ {outResult.message}</div>
            </div>}
          </div>
        )}
      </div>

      {/* Panel derecho */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ background:'#080f18', border:'1px solid rgba(0,180,255,.1)', borderRadius:12, padding:18, textAlign:'center' }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#5a7d99', letterSpacing:2.5, marginBottom:14 }}>BARRERA</div>
          <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:20, fontWeight:700, color:barrier?'#00ffa3':'#ff3d3d', marginBottom:12 }}>{barrier?'🔓 ABIERTA':'🔒 CERRADA'}</div>
          <button onClick={async () => { try { const d = await API.barrera.set(!barrier); setBD(d); } catch {} }}
            style={{ width:'100%', padding:'11px', background:barrier?'rgba(255,61,61,.1)':'rgba(0,255,163,.1)', border:`2px solid ${barrier?'#ff3d3d':'#00ffa3'}`, borderRadius:10, color:barrier?'#ff3d3d':'#00ffa3', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:14, cursor:'pointer' }}>
            {barrier?'🔒 CERRAR':'🔓 ABRIR'}
          </button>
        </div>
        <div style={{ background:'#080f18', border:'1px solid rgba(0,180,255,.1)', borderRadius:12, padding:16, textAlign:'center' }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#5a7d99', letterSpacing:2.5, marginBottom:12 }}>SEMÁFORO</div>
          <div style={{ display:'flex', justifyContent:'center', gap:16, marginBottom:10 }}>
            {[{c:'#ff3d3d',on:scanResult?.autorizado===false},{c:'#ff8c00',on:false},{c:'#00ffa3',on:scanResult?.autorizado===true}].map((s,i) => (
              <div key={i} style={{ width:32, height:32, borderRadius:'50%', background:s.on?s.c:'#0d1a24', border:`3px solid ${s.on?s.c:'#1a2f40'}`, boxShadow:s.on?`0 0 14px ${s.c}`:'none', transition:'all .4s' }}/>
            ))}
          </div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:scanResult?(scanResult.autorizado?'#00ffa3':'#ff3d3d'):'#5a7d99' }}>
            {scanResult?(scanResult.autorizado?'● AUTORIZADO':'● DENEGADO'):'○ EN ESPERA'}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── PANEL ESTUDIANTE ────────────────────────────────────────────
function StudentPanel({ onLogout }) {
  const [tab, setTab]       = useState('vehiculos');
  const [vehiculos, setVeh] = useState([]);
  const [loading, setL]     = useState(true);
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState({ placa:'', tipo:'Automóvil', marca:'', modelo:'', color:'', correo:'', telefono:'' });
  const [saving, setSaving] = useState(false);
  const [pErr, setPE]       = useState('');
  const user = JSON.parse(localStorage.getItem('ps_user') || '{}');
  const { toasts } = useToast();

  const load = useCallback(async () => {
    setL(true);
    try { const d = await API.vehiculos.list(`search=${user.first_name}`); setVeh(Array.isArray(d)?d:d.results||[]); }
    catch {} finally { setL(false); }
  }, [user.first_name]);

  useEffect(() => { load(); }, [load]);

  const valPlate = (p) => {
    const plate = p.toUpperCase().replace(/[-\s]/g,'');
    if (/^[A-Z]{3}\d{3}$/.test(plate)) return { ok:true, plate, kind:'Automóvil' };
    if (/^[A-Z]{3}\d{2}[A-Z]$/.test(plate)) return { ok:true, plate, kind:'Motocicleta' };
    return { ok:false, plate };
  };

  const submit = async () => {
    const pv = valPlate(form.placa);
    if (!pv.ok) { setPE('Formato inválido. Ej: ABC123 ó ABC12D'); return; }
    if (!form.correo) { setPE('El correo es requerido para recibir el QR'); return; }
    setSaving(true);
    try {
      await API.vehiculos.create({ ...form, placa:pv.plate, propietario:`${user.first_name} ${user.last_name}` });
      setModal(false); setForm({ placa:'', tipo:'Automóvil', marca:'', modelo:'', color:'', correo:'', telefono:'' }); setPE('');
      load();
      alert('✅ Vehículo registrado. Recibirás el QR en tu correo.');
    } catch (e) { setPE(e.placa?.[0] || e.error || 'Error al registrar'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ height:'100vh', background:'#04090f', color:'#d4ecff', fontFamily:"'IBM Plex Sans',sans-serif", display:'flex', flexDirection:'column' }}>
      <style>{CSS}</style>
      <Toasts items={toasts}/>
      <div style={{ height:56, borderBottom:'1px solid rgba(0,180,255,.1)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(8,15,24,.9)', backdropFilter:'blur(14px)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22 }}>🛡️</span>
          <div>
            <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:16, fontWeight:700, color:'#fff' }}>Puerta <span style={{ color:'#00b4ff' }}>Segura</span></div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7, color:'#00ffa3', letterSpacing:3 }}>PORTAL ESTUDIANTE</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontSize:13, color:'#5a7d99' }}>👋 {user.first_name} {user.last_name}</div>
          <button onClick={onLogout} style={{ padding:'7px 14px', borderRadius:7, border:'1px solid rgba(255,61,61,.3)', background:'rgba(255,61,61,.06)', color:'#ff8888', fontSize:12, cursor:'pointer' }}>⏻ Salir</button>
        </div>
      </div>
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <div style={{ width:190, background:'#080f18', borderRight:'1px solid rgba(0,180,255,.1)', flexShrink:0 }}>
          <div style={{ padding:'16px 16px 8px', fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#5a7d99', letterSpacing:2.5 }}>MENÚ</div>
          {[['vehiculos','🚗','Mis Vehículos'],['cuenta','👤','Mi Cuenta']].map(([id,icon,lbl]) => (
            <button key={id} onClick={() => setTab(id)} style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'12px 16px', background:tab===id?'rgba(0,180,255,.1)':'transparent', border:'none', borderLeft:tab===id?'3px solid #00b4ff':'3px solid transparent', color:tab===id?'#00b4ff':'#5a7d99', fontFamily:"'IBM Plex Sans',sans-serif", fontSize:13, cursor:'pointer', textAlign:'left' }}>
              <span style={{ fontSize:17 }}>{icon}</span><span style={{ fontWeight:tab===id?600:400 }}>{lbl}</span>
            </button>
          ))}
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'28px 30px' }}>
          {tab === 'vehiculos' && (
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
                <div>
                  <h2 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:24, fontWeight:700, color:'#fff' }}>🚗 Mis Vehículos</h2>
                  <div style={{ fontSize:12, color:'#5a7d99', marginTop:4 }}>Registra tus vehículos para acceder al campus con código QR</div>
                </div>
                <button onClick={() => setModal(true)} style={{ padding:'10px 20px', borderRadius:9, border:'none', background:'#00b4ff', color:'#000', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:14, cursor:'pointer' }}>+ Registrar Vehículo</button>
              </div>
              {loading ? <div style={{ textAlign:'center', padding:60, color:'#5a7d99' }}>Cargando...</div>
                : vehiculos.length === 0 ? (
                  <div style={{ background:'#080f18', border:'1px solid rgba(0,180,255,.1)', borderRadius:14, padding:'60px 20px', textAlign:'center' }}>
                    <div style={{ fontSize:56, marginBottom:16, opacity:.2 }}>🚗</div>
                    <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:20, fontWeight:700, color:'#fff', marginBottom:8 }}>Sin vehículos registrados</div>
                    <div style={{ fontSize:13, color:'#5a7d99', marginBottom:24 }}>Registra tu vehículo para obtener tu código QR de acceso</div>
                    <button onClick={() => setModal(true)} style={{ padding:'11px 24px', borderRadius:9, border:'none', background:'#00b4ff', color:'#000', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, cursor:'pointer' }}>+ Registrar mi primer vehículo</button>
                  </div>
                ) : (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
                    {vehiculos.map(v => (
                      <div key={v.id} style={{ background:'#080f18', border:'1px solid rgba(0,180,255,.15)', borderRadius:14, padding:22 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:20, fontWeight:700, color:'#00b4ff', letterSpacing:4 }}>{v.placa}</div>
                          <span style={{ padding:'3px 10px', borderRadius:99, fontSize:11, background:v.activo?'rgba(0,255,163,.12)':'rgba(255,61,61,.12)', color:v.activo?'#00ffa3':'#ff3d3d', border:`1px solid ${v.activo?'rgba(0,255,163,.3)':'rgba(255,61,61,.3)'}` }}>{v.activo?'● Activo':'○ Inactivo'}</span>
                        </div>
                        <div style={{ fontSize:13, color:'#d4ecff', fontWeight:600, marginBottom:4 }}>{v.tipo} {v.marca}</div>
                        <div style={{ fontSize:12, color:'#5a7d99', marginBottom:14 }}>Color: {v.color||'—'} · {v.dias_vigencia}d restantes</div>
                        <div style={{ textAlign:'center' }}>
                          <img src={v.qr_imagen_url} alt="QR" width={180} height={180} style={{ background:'#fff', borderRadius:8, padding:8 }}/>
                          <div style={{ fontSize:11, color:'#5a7d99', marginTop:8 }}>Muestra este QR en portería</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              }
              {modal && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500, backdropFilter:'blur(6px)' }} onClick={e => e.target===e.currentTarget&&setModal(false)}>
                  <div style={{ background:'#080f18', border:'1px solid rgba(0,180,255,.35)', borderRadius:14, padding:28, width:'100%', maxWidth:520, maxHeight:'90vh', overflowY:'auto', position:'relative' }}>
                    <div style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:20, fontWeight:700, color:'#fff', marginBottom:20, paddingBottom:14, borderBottom:'1px solid rgba(0,180,255,.1)' }}>🚗 Registrar mi Vehículo</div>
                    <button onClick={() => setModal(false)} style={{ position:'absolute', top:14, right:14, background:'rgba(255,255,255,.05)', border:'none', color:'#5a7d99', fontSize:16, cursor:'pointer', width:28, height:28, borderRadius:7 }}>✕</button>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
                      <div>
                        <div style={{ fontSize:10, color:'#5a7d99', letterSpacing:2.5, fontFamily:"'IBM Plex Mono',monospace", marginBottom:6, textTransform:'uppercase' }}>Placa *</div>
                        <input value={form.placa} maxLength={6} style={{ fontFamily:"'IBM Plex Mono',monospace", letterSpacing:5, fontSize:22, textAlign:'center' }}
                          onChange={e => { setForm(p=>({...p,placa:e.target.value.toUpperCase()})); setPE(''); }} placeholder="ABC123"/>
                        {form.placa.length>=5 && (() => { const pv=valPlate(form.placa); return <div style={{ fontSize:11, marginTop:4, color:pv.ok?'#00ffa3':'#ff8c00' }}>{pv.ok?`✓ ${pv.kind}`:'⚠ Inválido'}</div>; })()}
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:'#5a7d99', letterSpacing:2.5, fontFamily:"'IBM Plex Mono',monospace", marginBottom:6, textTransform:'uppercase' }}>Tipo</div>
                        <select value={form.tipo} onChange={e => setForm(p=>({...p,tipo:e.target.value}))}>
                          {['Automóvil','Motocicleta','Camioneta','Bicicleta','Otro'].map(o=><option key={o}>{o}</option>)}
                        </select>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:'#5a7d99', letterSpacing:2.5, fontFamily:"'IBM Plex Mono',monospace", marginBottom:6, textTransform:'uppercase' }}>Marca</div>
                        <input value={form.marca} onChange={e=>setForm(p=>({...p,marca:e.target.value}))} placeholder="Toyota, Yamaha..."/>
                      </div>
                      <div>
                        <div style={{ fontSize:10, color:'#5a7d99', letterSpacing:2.5, fontFamily:"'IBM Plex Mono',monospace", marginBottom:6, textTransform:'uppercase' }}>Color</div>
                        <input value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} placeholder="Blanco, Rojo..."/>
                      </div>
                      <div style={{ gridColumn:'span 2' }}>
                        <div style={{ fontSize:10, color:'#5a7d99', letterSpacing:2.5, fontFamily:"'IBM Plex Mono',monospace", marginBottom:6, textTransform:'uppercase' }}>Correo para recibir QR *</div>
                        <input type="email" value={form.correo} onChange={e=>setForm(p=>({...p,correo:e.target.value}))} placeholder="tu@correo.com"/>
                      </div>
                    </div>
                    {pErr && <div style={{ marginTop:12, padding:'10px 14px', background:'rgba(255,61,61,.08)', border:'1px solid rgba(255,61,61,.3)', borderRadius:8, fontSize:12, color:'#ff3d3d' }}>{pErr}</div>}
                    <div style={{ display:'flex', gap:9, marginTop:18 }}>
                      <button onClick={submit} disabled={saving} style={{ flex:1, padding:'11px', borderRadius:9, border:'none', background:'#00b4ff', color:'#000', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, fontSize:14, cursor:saving?'wait':'pointer', opacity:saving?.6:1 }}>
                        {saving?'⏳ Registrando...':'📲 Registrar y Recibir QR'}
                      </button>
                      <button onClick={() => { setModal(false); setPE(''); }} style={{ padding:'11px 18px', borderRadius:9, border:'1px solid rgba(0,180,255,.2)', background:'transparent', color:'#5a7d99', fontFamily:"'Rajdhani',sans-serif", fontWeight:700, cursor:'pointer' }}>Cancelar</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          {tab === 'cuenta' && (
            <div style={{ maxWidth:500 }}>
              <h2 style={{ fontFamily:"'Rajdhani',sans-serif", fontSize:24, fontWeight:700, color:'#fff', marginBottom:20 }}>👤 Mi Cuenta</h2>
              <div style={{ background:'#080f18', border:'1px solid rgba(0,180,255,.1)', borderRadius:14, padding:24, marginBottom:16, display:'flex', alignItems:'center', gap:18 }}>
                <div style={{ width:60, height:60, borderRadius:14, background:'rgba(0,180,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Rajdhani',sans-serif", fontSize:24, fontWeight:700, color:'#00b4ff', flexShrink:0 }}>
                  {user.avatar_initials||user.first_name?.[0]||'?'}
                </div>
                <div>
                  <div style={{ fontSize:18, fontWeight:700, color:'#fff' }}>{user.first_name} {user.last_name}</div>
                  <div style={{ fontSize:13, color:'#5a7d99', marginTop:4 }}>{user.email}</div>
                  <div style={{ marginTop:8, display:'inline-block', padding:'3px 10px', borderRadius:99, background:'rgba(0,180,255,.12)', border:'1px solid rgba(0,180,255,.3)', color:'#00b4ff', fontSize:11, fontFamily:"'IBM Plex Mono',monospace" }}>🎓 Estudiante</div>
                </div>
              </div>
              <div style={{ background:'#080f18', border:'1px solid rgba(255,61,61,.2)', borderRadius:14, padding:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'#fff' }}>Cerrar sesión</div>
                  <div style={{ fontSize:12, color:'#5a7d99', marginTop:3 }}>Saldrás del portal estudiantil</div>
                </div>
                <button onClick={onLogout} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid rgba(255,61,61,.3)', background:'rgba(255,61,61,.06)', color:'#ff8888', fontSize:13, cursor:'pointer' }}>⏻ Salir</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── PANEL VIGILANTE COMPLETO ────────────────────────────────────
function VigilanteApp({ onLogout }) {
  const { user, notifCount, setNC, wsConnected } = useApp();
  const { toasts, toast } = useToast();
  const [view, setView]       = useState('dashboard');
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNO]    = useState(false);
  const [collapsed, setColl]  = useState(false);
  const [time, setTime]       = useState(new Date());

  useEffect(() => { const t=setInterval(()=>setTime(new Date()),1000); return()=>clearInterval(t); },[]);
  useKey('k', () => setCmdOpen(p=>!p), true);
  useEffect(() => { API.onUnauthorized(() => { onLogout(); toast('Sesión expirada','warning'); }); }, [onLogout, toast]);

  const navigate = useCallback((v) => { setView(v); setCmdOpen(false); }, []);
  const isAdmin = user?.role === 'admin';

  // Vigilante tiene dashboard + vehículos + acceso + historial + lista negra + visitantes + reportes
  // Admin tiene todo lo anterior + usuarios + auditoría
  const NAV = [
    { id:'dashboard', icon:'📊', label:'Dashboard' },
    { id:'vehicles',  icon:'🚗', label:'Vehículos' },
    { id:'access',    icon:'📷', label:'Control de Acceso' },
    { id:'history',   icon:'📋', label:'Historial' },
    { id:'blacklist', icon:'🚫', label:'Lista Negra' },
    { id:'visitors',  icon:'👥', label:'Visitantes' },
    { id:'reports',   icon:'📈', label:'Reportes' },
    ...(isAdmin ? [{ id:'users', icon:'⚙️', label:'Usuarios' },{ id:'audit', icon:'🔍', label:'Auditoría' }] : []),
  ];

  const PAGES = {
    dashboard: <ErrorBoundary><Dashboard  toast={toast}/></ErrorBoundary>,
    vehicles:  <ErrorBoundary><Vehicles   toast={toast}/></ErrorBoundary>,
    access:    <ErrorBoundary><AccessCtrl toast={toast}/></ErrorBoundary>,
    history:   <ErrorBoundary><History    toast={toast}/></ErrorBoundary>,
    blacklist: <ErrorBoundary><Blacklist  toast={toast}/></ErrorBoundary>,
    visitors:  <ErrorBoundary><Visitors   toast={toast}/></ErrorBoundary>,
    reports:   <ErrorBoundary><Reports    toast={toast}/></ErrorBoundary>,
    users:     <ErrorBoundary><Audit      toast={toast}/></ErrorBoundary>,
    audit:     <ErrorBoundary><Audit      toast={toast}/></ErrorBoundary>,
  };

  return (
    <div style={{ height:'100vh', overflow:'hidden', fontFamily:F.body, background:T.bg, color:T.text, display:'flex', flexDirection:'column' }}>
      <style>{CSS}</style>
      <Toasts items={toasts}/>
      <BackendStatus/>
      {cmdOpen && <CommandPalette onClose={()=>setCmdOpen(false)} onNavigate={navigate} nav={NAV}/>}
      {notifOpen && <NotifPanel onClose={()=>setNO(false)} toast={toast} onCountChange={setNC}/>}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        <Sidebar nav={NAV} view={view} onNavigate={navigate} collapsed={collapsed} onToggleCollapse={()=>setColl(p=>!p)} onLogout={onLogout}/>
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', minWidth:0 }}>
          <div style={{ height:52, borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 20px', background:'rgba(8,15,24,.9)', backdropFilter:'blur(14px)', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <button style={{ background:'none', border:'none', color:T.muted, cursor:'pointer', fontSize:18, padding:4 }} onClick={()=>setColl(p=>!p)}>☰</button>
              <span style={{ fontFamily:F.head, fontSize:15, fontWeight:600, color:T.head }}>{NAV.find(n=>n.id===view)?.icon} {NAV.find(n=>n.id===view)?.label}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:wsConnected?'#00ffa3':'#ff8c00', flexShrink:0 }}/>
              <div style={{ fontFamily:F.mono, fontSize:12, color:T.muted }}>{fmtTime(time)}</div>
              <button onClick={()=>setCmdOpen(true)} style={{ fontFamily:F.mono, fontSize:10, color:T.muted, padding:'5px 10px', background:'rgba(255,255,255,.04)', border:`1px solid ${T.border}`, borderRadius:7, cursor:'pointer' }}>⌘ K</button>
              <div style={{ position:'relative' }}>
                <button onClick={()=>setNO(p=>!p)} style={{ background:'rgba(0,180,255,.06)', border:`1px solid ${T.border}`, borderRadius:8, color:T.muted, cursor:'pointer', padding:'6px 10px', fontSize:15 }}>🔔</button>
                {notifCount>0 && <div style={{ position:'absolute', top:-4, right:-4, width:17, height:17, borderRadius:'50%', background:'#ff3d3d', color:'#fff', fontSize:9.5, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', border:`2px solid ${T.bg}` }}>{notifCount>9?'9+':notifCount}</div>}
              </div>
            </div>
          </div>
          <div key={view} className="page main-content" style={{ flex:1, overflowY:'auto', padding:'22px 24px' }}>
            {view === 'access' ? <AccessCtrl toast={toast}/> : PAGES[view]}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── APP PRINCIPAL ───────────────────────────────────────────────
function AppInner() {
  const [screen, setScreen] = useState('landing');
  const { logout, login } = useApp();
  const { toasts } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('ps_token');
    const savedUser = localStorage.getItem('ps_user');
    if (token && savedUser) {
      const u = JSON.parse(savedUser);
      API.setToken(token);
      API.setUser(u);
      login(u, token, null);
    }
  }, []);

  const handleSuccess = (userData) => {
    if (userData.role === 'estudiante') setScreen('estudiante');
    else setScreen('vigilante');
  };

  const handleLogout = async () => {
    try { const r=API.getRefresh(); if(r) await API.auth.logout(r); } catch {}
    API.clearAuth();
    localStorage.removeItem('ps_token');
    localStorage.removeItem('ps_user');
    logout();
    setScreen('landing');
  };

  return (
    <>
      <style>{CSS}</style>
      <Toasts items={toasts}/>
      {screen==='landing'    && <LandingPage onEstudiante={()=>setScreen('login-est')} onVigilante={()=>setScreen('login-vig')}/>}
      {screen==='login-est'  && <LoginEstudiante onBack={()=>setScreen('landing')} onSuccess={handleSuccess}/>}
      {screen==='login-vig'  && <LoginVigilante  onBack={()=>setScreen('landing')} onSuccess={handleSuccess}/>}
      {screen==='estudiante' && <StudentPanel onLogout={handleLogout}/>}
      {screen==='vigilante'  && <VigilanteApp onLogout={handleLogout}/>}
    </>
  );
}
export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <AppInner/>
      </AppProvider>
    </ErrorBoundary>
  );
}