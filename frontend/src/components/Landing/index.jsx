// src/components/Landing/index.jsx — Página de inicio informativa
import { useState } from "react";
import { T, F } from "../../utils";

export default function Landing({ onLoginVigilante, onLoginEstudiante }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMenuOpen(false);
  };

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: F.body, overflowY: 'auto', overflowX: 'hidden' }}>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <nav style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'rgba(4,9,15,.92)', backdropFilter: 'blur(14px)', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => scrollTo('inicio')}>
            <span style={{ fontSize: 28, filter: `drop-shadow(0 0 8px ${T.blue}60)` }}>🛡️</span>
            <div>
              <div style={{ fontFamily: F.head, fontSize: 18, fontWeight: 700, color: T.head, letterSpacing: 1 }}>
                Puerta <span style={{ color: T.blue }}>Segura</span>
              </div>
              <div style={{ fontFamily: F.mono, fontSize: 7, color: T.green, letterSpacing: 3 }}>v3.0 · UCUNDINAMARCA</div>
            </div>
          </div>

          {/* Links desktop */}
          <div className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {[['inicio','Inicio'],['funciones','Funciones'],['acerca','Acerca de'],['contacto','Contacto']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)}
                style={{ background: 'none', border: 'none', color: T.muted, fontFamily: F.body, fontSize: 14, cursor: 'pointer', padding: '8px 14px', borderRadius: 8, transition: 'all .2s' }}
                onMouseOver={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.background = 'rgba(255,255,255,.05)'; }}
                onMouseOut={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.background = 'none'; }}>
                {label}
              </button>
            ))}

            <div style={{ width: 1, height: 24, background: T.border, margin: '0 8px' }} />

            <button onClick={onLoginEstudiante}
              style={{ padding: '9px 18px', borderRadius: 8, border: `1px solid ${T.blue}`, background: 'transparent', color: T.blue, fontFamily: F.head, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .2s', letterSpacing: .5 }}
              onMouseOver={e => { e.currentTarget.style.background = `${T.blue}18`; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; }}>
              🎓 Estudiante
            </button>

            <button onClick={onLoginVigilante}
              style={{ padding: '9px 18px', borderRadius: 8, border: 'none', background: T.blue, color: '#000', fontFamily: F.head, fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .2s', letterSpacing: .5, boxShadow: `0 4px 16px ${T.blue}40` }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = ''; }}>
              👁️ Vigilante
            </button>
          </div>

          {/* Hamburger mobile */}
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{ display: 'none', background: 'none', border: 'none', color: T.text, fontSize: 24, cursor: 'pointer' }}
            className="hamburger">☰</button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: T.card, borderTop: `1px solid ${T.border}`, padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[['inicio','Inicio'],['funciones','Funciones'],['acerca','Acerca de'],['contacto','Contacto']].map(([id, label]) => (
              <button key={id} onClick={() => scrollTo(id)}
                style={{ background: 'none', border: 'none', color: T.text, fontFamily: F.body, fontSize: 15, cursor: 'pointer', padding: '10px 14px', borderRadius: 8, textAlign: 'left' }}>
                {label}
              </button>
            ))}
            <button onClick={onLoginEstudiante} style={{ padding: '11px', borderRadius: 8, border: `1px solid ${T.blue}`, background: 'transparent', color: T.blue, fontFamily: F.head, fontWeight: 700, cursor: 'pointer' }}>🎓 Entrar como Estudiante</button>
            <button onClick={onLoginVigilante} style={{ padding: '11px', borderRadius: 8, border: 'none', background: T.blue, color: '#000', fontFamily: F.head, fontWeight: 700, cursor: 'pointer' }}>👁️ Entrar como Vigilante</button>
          </div>
        )}
      </nav>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section id="inicio" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '100px 24px 60px', position: 'relative', overflow: 'hidden' }}>
        {/* Background grid */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(rgba(0,180,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,255,.04) 1px,transparent 1px)`, backgroundSize: '50px 50px' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 60% at 50% 50%,rgba(0,90,200,.12) 0%,transparent 70%)' }} />
        {/* Orbs */}
        {[['10%','20%','#00b4ff'],['80%','70%','#a464ff'],['70%','15%','#00ffa3']].map(([l,t,c],i) => (
          <div key={i} style={{ position:'absolute', left:l, top:t, width:200, height:200, borderRadius:'50%', background:c, filter:'blur(80px)', opacity:.07, pointerEvents:'none' }}/>
        ))}

        <div style={{ maxWidth: 800, textAlign: 'center', position: 'relative' }}>
          <div style={{ fontSize: 80, marginBottom: 20, filter: `drop-shadow(0 0 40px ${T.blue}50)` }}>🛡️</div>
          <div style={{ fontFamily: F.mono, fontSize: 11, color: T.green, letterSpacing: 6, marginBottom: 16, animation: 'blink 3s infinite' }}>● SISTEMA ACTIVO · UNIVERSIDAD DE CUNDINAMARCA</div>
          <h1 style={{ fontFamily: F.head, fontSize: 56, fontWeight: 700, color: T.head, lineHeight: 1.1, marginBottom: 20, letterSpacing: 2 }}>
            PUERTA <span style={{ color: T.blue, textShadow: `0 0 40px ${T.blue}60` }}>SEGURA</span>
          </h1>
          <p style={{ fontSize: 18, color: T.muted, lineHeight: 1.7, marginBottom: 40, maxWidth: 580, margin: '0 auto 40px' }}>
            Sistema inteligente de control de acceso vehicular para la <strong style={{ color: T.text }}>Universidad de Cundinamarca, Seccional Girardot</strong>. Seguridad, trazabilidad y eficiencia en tiempo real.
          </p>

          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 60 }}>
            <button onClick={onLoginEstudiante}
              style={{ padding: '14px 32px', borderRadius: 10, border: `2px solid ${T.blue}`, background: 'transparent', color: T.blue, fontFamily: F.head, fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'all .25s', letterSpacing: 1 }}
              onMouseOver={e => { e.currentTarget.style.background = `${T.blue}18`; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = ''; }}>
              🎓 Soy Estudiante
            </button>
            <button onClick={onLoginVigilante}
              style={{ padding: '14px 32px', borderRadius: 10, border: 'none', background: T.blue, color: '#000', fontFamily: F.head, fontWeight: 700, fontSize: 16, cursor: 'pointer', transition: 'all .25s', letterSpacing: 1, boxShadow: `0 6px 28px ${T.blue}50` }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 10px 36px ${T.blue}70`; }}
              onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 6px 28px ${T.blue}50`; }}>
              👁️ Soy Vigilante / Admin
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 40, justifyContent: 'center', flexWrap: 'wrap' }}>
            {[['12+','Funcionalidades'],['100%','Trazabilidad'],['24/7','Disponible'],['v3.0','Versión actual']].map(([n,l],i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: F.head, fontSize: 32, fontWeight: 700, color: T.blue }}>{n}</div>
                <div style={{ fontSize: 12, color: T.muted, fontFamily: F.mono }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FUNCIONES ──────────────────────────────────────────── */}
      <section id="funciones" style={{ padding: '80px 24px', background: T.card }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: T.blue, letterSpacing: 4, marginBottom: 12 }}>FUNCIONALIDADES</div>
            <h2 style={{ fontFamily: F.head, fontSize: 38, fontWeight: 700, color: T.head }}>Todo lo que necesitas</h2>
            <p style={{ color: T.muted, fontSize: 15, marginTop: 12 }}>12 funcionalidades completamente implementadas</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 20 }}>
            {[
              { icon:'📱', title:'Código QR Inteligente',    desc:'Genera QR con hash SHA-256 único por vehículo. Válido por 365 días y enviado automáticamente al correo.' },
              { icon:'📷', title:'Escaneo con Cámara Real',  desc:'Escanea el QR directamente con la cámara del dispositivo. Detección instantánea con jsQR.' },
              { icon:'🚗', title:'Registro de Vehículos',    desc:'Validación de placas colombianas (ABC123 automóviles, ABC12D motos). Registro completo del propietario.' },
              { icon:'🚫', title:'Lista Negra Automática',   desc:'Vehículos bloqueados reciben alerta inmediata. Notificaciones en tiempo real a administradores.' },
              { icon:'📊', title:'Dashboard en Tiempo Real', desc:'Estadísticas actualizadas al instante. Gráficas de accesos por hora, tendencias y mapa de calor.' },
              { icon:'👥', title:'Control de Visitantes',    desc:'Registro de entrada y salida. Alertas automáticas de permanencia prolongada mayor a 4 horas.' },
              { icon:'📋', title:'Historial Completo',       desc:'Todos los accesos registrados. Exportable a Excel, CSV y PDF con filtros por fecha y placa.' },
              { icon:'🔒', title:'Seguridad JWT',            desc:'Autenticación con tokens seguros. Bloqueo automático tras 5 intentos fallidos de login.' },
              { icon:'📈', title:'Reportes Ejecutivos',      desc:'Reportes por rango de fechas personalizado con tasa de autorización y análisis por método.' },
            ].map((f, i) => (
              <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: '24px 20px', transition: 'all .2s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = T.borderHov; e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,180,255,.1)`; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none'; }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontFamily: F.head, fontSize: 17, fontWeight: 700, color: T.head, marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACERCA DE ──────────────────────────────────────────── */}
      <section id="acerca" style={{ padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: F.mono, fontSize: 10, color: T.blue, letterSpacing: 4, marginBottom: 12 }}>ACERCA DE</div>
            <h2 style={{ fontFamily: F.head, fontSize: 38, fontWeight: 700, color: T.head, marginBottom: 20 }}>¿Qué es Puerta Segura?</h2>
            <p style={{ color: T.muted, fontSize: 15, lineHeight: 1.8, marginBottom: 16 }}>
              Puerta Segura es un sistema académico desarrollado por estudiantes de <strong style={{ color: T.text }}>Ingeniería de Software</strong> de la Universidad de Cundinamarca, Seccional Girardot.
            </p>
            <p style={{ color: T.muted, fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
              Fue creado para modernizar el control de acceso vehicular del campus, reemplazando los registros manuales con tecnología QR, validación automática y reportes en tiempo real.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {['Django 4.2','React 18','MySQL 8.0','JWT','WebSockets','Celery'].map(t => (
                <span key={t} style={{ padding: '6px 14px', borderRadius: 99, background: `${T.blue}14`, border: `1px solid ${T.blue}30`, color: T.blue, fontFamily: F.mono, fontSize: 11 }}>{t}</span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { icon:'👨‍💻', name:'Sebastián D. Uribe C.',   role:'Desarrollador Backend & Arquitectura' },
              { icon:'👨‍💻', name:'Andrés F. Castañeda',     role:'Desarrollador Frontend & UX' },
            ].map((p,i) => (
              <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 40, flexShrink: 0 }}>{p.icon}</div>
                <div>
                  <div style={{ fontFamily: F.head, fontSize: 17, fontWeight: 700, color: T.head }}>{p.name}</div>
                  <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>{p.role}</div>
                  <div style={{ fontSize: 11, color: T.blue, marginTop: 4, fontFamily: F.mono }}>Ingeniería de Software · UCUNDINAMARCA</div>
                </div>
              </div>
            ))}
            <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '20px 22px' }}>
              <div style={{ fontFamily: F.head, fontSize: 16, fontWeight: 700, color: T.head, marginBottom: 8 }}>🏫 Universidad de Cundinamarca</div>
              <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>Seccional Girardot · Programa Ingeniería de Software · Proyecto de Grado 2026</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTACTO ───────────────────────────────────────────── */}
      <section id="contacto" style={{ padding: '80px 24px', background: T.card }}>
        <div style={{ maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.blue, letterSpacing: 4, marginBottom: 12 }}>CONTACTO</div>
          <h2 style={{ fontFamily: F.head, fontSize: 38, fontWeight: 700, color: T.head, marginBottom: 16 }}>¿Tienes preguntas?</h2>
          <p style={{ color: T.muted, fontSize: 15, lineHeight: 1.7, marginBottom: 40 }}>
            Para soporte técnico o información sobre el sistema comunícate con el equipo de desarrollo.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon:'📧', label:'Correo', value:'sduribe@ucundinamarca.edu.co' },
              { icon:'🏫', label:'Universidad', value:'Universidad de Cundinamarca, Seccional Girardot' },
              { icon:'💻', label:'Programa', value:'Ingeniería de Software' },
            ].map((c,i) => (
              <div key={i} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
                <span style={{ fontSize: 24, flexShrink: 0 }}>{c.icon}</span>
                <div>
                  <div style={{ fontSize: 11, color: T.muted, fontFamily: F.mono, marginBottom: 3 }}>{c.label}</div>
                  <div style={{ fontSize: 14, color: T.text }}>{c.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={onLoginEstudiante}
              style={{ padding: '13px 28px', borderRadius: 9, border: `2px solid ${T.blue}`, background: 'transparent', color: T.blue, fontFamily: F.head, fontWeight: 700, fontSize: 15, cursor: 'pointer', transition: 'all .2s' }}
              onMouseOver={e => e.currentTarget.style.background = `${T.blue}18`}
              onMouseOut={e => e.currentTarget.style.background = 'transparent'}>
              🎓 Acceso Estudiante
            </button>
            <button onClick={onLoginVigilante}
              style={{ padding: '13px 28px', borderRadius: 9, border: 'none', background: T.blue, color: '#000', fontFamily: F.head, fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: `0 4px 18px ${T.blue}40`, transition: 'all .2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseOut={e => e.currentTarget.style.transform = ''}>
              👁️ Acceso Vigilante
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{ padding: '24px', borderTop: `1px solid ${T.border}`, textAlign: 'center' }}>
        <div style={{ fontFamily: F.mono, fontSize: 11, color: T.muted }}>
          🛡️ Puerta Segura v3.0 · Universidad de Cundinamarca · Seccional Girardot · 2026
        </div>
      </footer>

      <style>{`
        @media(max-width:768px){
          .nav-links{display:none!important;}
          .hamburger{display:block!important;}
          h1{font-size:36px!important;}
          #acerca > div{grid-template-columns:1fr!important;}
        }
      `}</style>
    </div>
  );
}
