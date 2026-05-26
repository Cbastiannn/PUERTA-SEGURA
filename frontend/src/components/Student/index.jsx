// src/components/Student/index.jsx — Panel del Estudiante
import { useState, useEffect, useCallback } from "react";
import { T, F, fmtDT } from "../../utils";
import { Modal, Lbl, Btn, PrimaryBtn, Badge, Empty, Spinner } from "../UI";
import { validatePlate } from "../../utils";
import * as API from "../../api";

// ── Mis Vehículos ───────────────────────────────────────────────
function MisVehiculos({ user, toast }) {
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setL]           = useState(true);
  const [modal, setModal]         = useState(null);
  const [form, setForm]           = useState({ placa:'', tipo:'Automóvil', marca:'', modelo:'', color:'', documento:'', correo: user?.email || '', telefono:'', notas:'' });
  const [saving, setSaving]       = useState(false);
  const [pInfo, setPInfo]         = useState(null);

  const TIPOS = ['Automóvil','Motocicleta','Camioneta','Bicicleta','Otro'];

  const load = useCallback(async () => {
    setL(true);
    try {
      const d = await API.vehiculos.list(`search=${user?.first_name} ${user?.last_name}`);
      setVehiculos(Array.isArray(d) ? d : d.results || []);
    } catch { toast('Error cargando vehículos','error'); }
    finally { setL(false); }
  }, [user, toast]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    const pv = validatePlate(form.placa);
    if (!pv.valid) { toast('Formato de placa inválido. Ej: ABC123','error'); return; }
    setSaving(true);
    try {
      await API.vehiculos.create({
        ...form,
        placa: pv.plate,
        propietario: `${user?.first_name} ${user?.last_name}`,
      });
      toast(`✅ Vehículo ${pv.plate} registrado. QR enviado a tu correo.`,'success');
      setModal(null);
      setForm({ placa:'', tipo:'Automóvil', marca:'', modelo:'', color:'', documento:'', correo: user?.email || '', telefono:'', notas:'' });
      load();
    } catch (e) { toast(e.placa?.[0] || e.error || 'Error al registrar','error'); }
    finally { setSaving(false); }
  };

  const verQR = async (id) => {
    try { setModal({ type:'qr', qr: await API.vehiculos.qr(id) }); }
    catch { toast('Error cargando QR','error'); }
  };

  const reenviar = async (id) => {
    try { const r = await API.vehiculos.reenviarQR(id); toast(r.message,'success'); }
    catch (e) { toast(e.error || 'Error','error'); }
  };

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <div>
          <h2 style={{ fontFamily:F.head, fontSize:22, fontWeight:700, color:T.head }}>🚗 Mis Vehículos</h2>
          <div style={{ fontSize:12, color:T.muted, marginTop:4 }}>Registra y gestiona tus vehículos autorizados para ingresar al campus</div>
        </div>
        <PrimaryBtn onClick={() => setModal('add')}>+ Registrar Vehículo</PrimaryBtn>
      </div>

      {loading ? <div style={{ textAlign:'center', padding:60 }}><Spinner size={40}/></div>
        : vehiculos.length === 0
          ? (
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:'60px 20px', textAlign:'center' }}>
              <div style={{ fontSize:56, marginBottom:16, opacity:.2 }}>🚗</div>
              <div style={{ fontFamily:F.head, fontSize:20, fontWeight:700, color:T.head, marginBottom:8 }}>Sin vehículos registrados</div>
              <div style={{ fontSize:13, color:T.muted, marginBottom:24 }}>Registra tu vehículo para acceder al campus con código QR</div>
              <PrimaryBtn onClick={() => setModal('add')}>+ Registrar mi primer vehículo</PrimaryBtn>
            </div>
          )
          : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:16 }}>
              {vehiculos.map(v => (
                <div key={v.id} style={{ background:T.card, border:`1px solid ${v.activo?T.border:'rgba(255,61,61,.2)'}`, borderRadius:14, padding:22, transition:'all .2s' }}
                  onMouseOver={e => { e.currentTarget.style.borderColor=T.borderHov; e.currentTarget.style.transform='translateY(-2px)'; }}
                  onMouseOut={e => { e.currentTarget.style.borderColor=v.activo?T.border:'rgba(255,61,61,.2)'; e.currentTarget.style.transform=''; }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
                    <div style={{ fontFamily:F.mono, fontSize:22, fontWeight:700, color:T.blue, letterSpacing:4 }}>{v.placa}</div>
                    <Badge color={v.activo?T.green:T.red}>{v.activo?'● Activo':'○ Inactivo'}</Badge>
                  </div>
                  <div style={{ fontSize:13, color:T.text, fontWeight:600, marginBottom:4 }}>{v.tipo} {v.marca} {v.modelo}</div>
                  <div style={{ fontSize:12, color:T.muted, marginBottom:12 }}>Color: {v.color || 'No especificado'}</div>

                  {/* Vigencia */}
                  <div style={{ background:v.dias_vigencia<30?'rgba(255,140,0,.08)':'rgba(0,180,255,.06)', border:`1px solid ${v.dias_vigencia<30?T.orange:T.blue}25`, borderRadius:8, padding:'8px 12px', marginBottom:14 }}>
                    <div style={{ fontFamily:F.mono, fontSize:10, color:T.muted, marginBottom:2 }}>VIGENCIA DEL QR</div>
                    <div style={{ fontSize:13, color:v.dias_vigencia<30?T.orange:T.blue, fontWeight:600 }}>
                      {v.dias_vigencia} días restantes {v.dias_vigencia<30&&'⚠️'}
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:8 }}>
                    <Btn onClick={() => verQR(v.id)} full>📱 Ver mi QR</Btn>
                    {v.correo && <Btn onClick={() => reenviar(v.id)} color={T.purple} sm title="Reenviar QR al correo">📧</Btn>}
                  </div>
                </div>
              ))}
            </div>
          )
      }

      {/* Modal registrar */}
      {modal === 'add' && (
        <Modal onClose={() => setModal(null)} title="🚗 Registrar mi Vehículo" width={600}>
          <div style={{ marginBottom:14, padding:'10px 14px', background:'rgba(0,180,255,.05)', border:`1px solid ${T.border}`, borderRadius:8, fontSize:12, color:T.muted }}>
            ℹ️ Una vez registrado recibirás el código QR en tu correo. Muéstralo en portería para acceder al campus.
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13 }}>
            <div>
              <Lbl c="Placa *"/>
              <input value={form.placa} maxLength={6}
                style={{ fontFamily:F.mono, letterSpacing:5, fontSize:22, textAlign:'center' }}
                onChange={e => { const v=e.target.value.toUpperCase(); setForm(p=>({...p,placa:v})); setPInfo(v.length>=5?validatePlate(v):null); }}
                placeholder="ABC123"/>
              {pInfo && <div style={{ fontSize:11, marginTop:4, color:pInfo.valid?T.green:T.orange }}>{pInfo.valid?`✓ ${pInfo.kind}`:'⚠ Formato inválido'}</div>}
            </div>
            <div><Lbl c="Tipo"/>
              <select value={form.tipo} onChange={e => setForm(p=>({...p,tipo:e.target.value}))}>
                {TIPOS.map(o=><option key={o}>{o}</option>)}
              </select>
            </div>
            <div><Lbl c="Marca"/><input value={form.marca} onChange={e=>setForm(p=>({...p,marca:e.target.value}))} placeholder="Toyota, Yamaha..."/></div>
            <div><Lbl c="Modelo"/><input value={form.modelo} onChange={e=>setForm(p=>({...p,modelo:e.target.value}))} placeholder="Corolla, FZ..."/></div>
            <div><Lbl c="Color"/><input value={form.color} onChange={e=>setForm(p=>({...p,color:e.target.value}))} placeholder="Blanco, Rojo..."/></div>
            <div><Lbl c="Documento (CC)"/><input value={form.documento} onChange={e=>setForm(p=>({...p,documento:e.target.value}))} placeholder="Tu número de cédula"/></div>
            <div><Lbl c="Correo para recibir QR"/>
              <input type="email" value={form.correo} onChange={e=>setForm(p=>({...p,correo:e.target.value}))} placeholder="tu@correo.com"/>
            </div>
            <div><Lbl c="Teléfono"/><input value={form.telefono} onChange={e=>setForm(p=>({...p,telefono:e.target.value}))} placeholder="3101234567"/></div>
          </div>
          <div style={{ display:'flex', gap:9, marginTop:18 }}>
            <PrimaryBtn onClick={submit} loading={saving} full>📲 Registrar y Recibir QR</PrimaryBtn>
            <Btn onClick={() => setModal(null)} color={T.muted}>Cancelar</Btn>
          </div>
        </Modal>
      )}

      {/* Modal QR */}
      {modal?.type === 'qr' && (
        <Modal onClose={() => setModal(null)} title={`📱 Tu QR de Acceso — ${modal.qr.placa}`}>
          <div style={{ textAlign:'center' }}>
            <div style={{ background:'#fff', borderRadius:12, padding:14, display:'inline-block', boxShadow:`0 0 40px ${T.blue}30`, marginBottom:14 }}>
              <img src={modal.qr.qr_imagen_url} alt="QR" width={220} height={220} style={{ display:'block' }}/>
            </div>
            <div style={{ fontSize:14, color:T.head, fontWeight:600, marginBottom:4 }}>{modal.qr.propietario}</div>
            <div style={{ fontSize:12, color:T.muted, marginBottom:16 }}>{modal.qr.tipo} {modal.qr.marca} · {modal.qr.color}</div>
            <div style={{ padding:'12px 16px', background:'rgba(0,180,255,.06)', border:`1px solid ${T.border}`, borderRadius:10, fontSize:13, color:T.muted, marginBottom:16, lineHeight:1.6 }}>
              📌 Muestra este QR en la cámara del vigilante al llegar al campus.<br/>
              ⏱ Vigente por <strong style={{ color:T.blue }}>{modal.qr.dias_vigencia} días</strong>.
            </div>
            <Btn onClick={() => setModal(null)} color={T.muted} full>Cerrar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ── Mi Cuenta ───────────────────────────────────────────────────
function MiCuenta({ user, toast, onLogout }) {
  const [form, setForm]     = useState({ first_name: user?.first_name||'', last_name: user?.last_name||'', phone: user?.phone||'' });
  const [passForm, setPass] = useState({ current:'', nueva:'', confirmar:'' });
  const [saving, setSaving] = useState(false);
  const [savingPass, setSP] = useState(false);

  const saveProfile = async () => {
    setSaving(true);
    try {
      await API.users.update(user.id, form);
      toast('✅ Perfil actualizado','success');
    } catch { toast('Error al guardar','error'); }
    finally { setSaving(false); }
  };

  const changePass = async () => {
    if (passForm.nueva.length < 8) { toast('Mínimo 8 caracteres','error'); return; }
    if (passForm.nueva !== passForm.confirmar) { toast('Las contraseñas no coinciden','error'); return; }
    setSP(true);
    try {
      await API.users.resetPassword(user.id, passForm.nueva);
      toast('✅ Contraseña actualizada','success');
      setPass({ current:'', nueva:'', confirmar:'' });
    } catch { toast('Error al cambiar contraseña','error'); }
    finally { setSP(false); }
  };

  return (
    <div style={{ maxWidth:600 }}>
      <h2 style={{ fontFamily:F.head, fontSize:22, fontWeight:700, color:T.head, marginBottom:20 }}>👤 Mi Cuenta</h2>

      {/* Avatar */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:24, marginBottom:20, display:'flex', alignItems:'center', gap:18 }}>
        <div style={{ width:64, height:64, borderRadius:14, background:'rgba(0,180,255,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:F.head, fontSize:26, fontWeight:700, color:T.blue, border:`2px solid rgba(0,180,255,.3)`, flexShrink:0 }}>
          {user?.avatar_initials || user?.first_name?.[0] || '?'}
        </div>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:T.head }}>{user?.first_name} {user?.last_name}</div>
          <div style={{ fontSize:13, color:T.muted, marginTop:4 }}>{user?.email}</div>
          <div style={{ marginTop:8 }}><Badge color={T.blue}>🎓 Estudiante</Badge></div>
        </div>
      </div>

      {/* Editar perfil */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:24, marginBottom:20 }}>
        <div style={{ fontFamily:F.head, fontSize:16, fontWeight:700, color:T.head, marginBottom:16 }}>Información personal</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:13, marginBottom:16 }}>
          <div><Lbl c="Nombre"/><input value={form.first_name} onChange={e=>setForm(p=>({...p,first_name:e.target.value}))} placeholder="Tu nombre"/></div>
          <div><Lbl c="Apellido"/><input value={form.last_name} onChange={e=>setForm(p=>({...p,last_name:e.target.value}))} placeholder="Tu apellido"/></div>
          <div style={{ gridColumn:'span 2' }}><Lbl c="Teléfono"/><input value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="3101234567"/></div>
        </div>
        <PrimaryBtn onClick={saveProfile} loading={saving}>💾 Guardar cambios</PrimaryBtn>
      </div>

      {/* Cambiar contraseña */}
      <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, padding:24, marginBottom:20 }}>
        <div style={{ fontFamily:F.head, fontSize:16, fontWeight:700, color:T.head, marginBottom:16 }}>🔒 Cambiar contraseña</div>
        <div style={{ display:'flex', flexDirection:'column', gap:13, marginBottom:16 }}>
          <div><Lbl c="Nueva contraseña (mín. 8 caracteres)"/><input type="password" value={passForm.nueva} onChange={e=>setPass(p=>({...p,nueva:e.target.value}))} placeholder="••••••••"/></div>
          <div><Lbl c="Confirmar nueva contraseña"/><input type="password" value={passForm.confirmar} onChange={e=>setPass(p=>({...p,confirmar:e.target.value}))} placeholder="••••••••"/></div>
        </div>
        <PrimaryBtn onClick={changePass} loading={savingPass} color={T.purple}>🔑 Cambiar contraseña</PrimaryBtn>
      </div>

      {/* Cerrar sesión */}
      <div style={{ background:T.card, border:'1px solid rgba(255,61,61,.2)', borderRadius:14, padding:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:14, fontWeight:600, color:T.head }}>Cerrar sesión</div>
          <div style={{ fontSize:12, color:T.muted, marginTop:3 }}>Saldrás de tu cuenta en este dispositivo</div>
        </div>
        <Btn onClick={onLogout} color={T.red}>⏻ Cerrar sesión</Btn>
      </div>
    </div>
  );
}

// ── Panel principal estudiante ───────────────────────────────────
export default function StudentPanel({ onLogout, toast }) {
  const [tab, setTab] = useState('vehiculos');
  const user = JSON.parse(localStorage.getItem('ps_user') || '{}');

  const NAV = [
    { id:'vehiculos', icon:'🚗', label:'Mis Vehículos' },
    { id:'cuenta',    icon:'👤', label:'Mi Cuenta' },
  ];

  const T2 = { bg:'#04090f', card:'#080f18', blue:'#00b4ff', head:'#ffffff', muted:'#5a7d99', border:'rgba(0,180,255,.1)' };

  return (
    <div style={{ height:'100vh', overflow:'hidden', background:T.bg, color:T.text, fontFamily:F.body, display:'flex', flexDirection:'column' }}>
      {/* Topbar */}
      <div style={{ height:56, borderBottom:`1px solid ${T.border}`, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', background:'rgba(8,15,24,.9)', backdropFilter:'blur(14px)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:22, filter:`drop-shadow(0 0 8px ${T.blue}50)` }}>🛡️</span>
          <div>
            <div style={{ fontFamily:F.head, fontSize:15, fontWeight:700, color:T.head, letterSpacing:1 }}>Puerta <span style={{ color:T.blue }}>Segura</span></div>
            <div style={{ fontFamily:F.mono, fontSize:7, color:'#00ffa3', letterSpacing:3 }}>PORTAL ESTUDIANTE</div>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ fontSize:13, color:T.muted }}>👋 {user.first_name} {user.last_name}</div>
          <Btn onClick={onLogout} color={T.red} sm>⏻ Salir</Btn>
        </div>
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* Sidebar */}
        <div style={{ width:200, background:T.card, borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', flexShrink:0 }}>
          <div style={{ padding:'20px 16px 8px', fontFamily:F.mono, fontSize:9, color:T.muted, letterSpacing:2.5 }}>MENÚ</div>
          {NAV.map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              style={{ display:'flex', alignItems:'center', gap:12, width:'100%', padding:'12px 16px', background:tab===n.id?'rgba(0,180,255,.1)':'transparent', border:'none', borderLeft:tab===n.id?`3px solid ${T.blue}`:'3px solid transparent', color:tab===n.id?T.blue:T.muted, fontFamily:F.body, fontSize:13, cursor:'pointer', textAlign:'left', transition:'all .15s' }}
              onMouseOver={e => { if(tab!==n.id){ e.currentTarget.style.color=T.text; e.currentTarget.style.background='rgba(255,255,255,.03)'; }}}
              onMouseOut={e => { if(tab!==n.id){ e.currentTarget.style.color=T.muted; e.currentTarget.style.background='transparent'; }}}>
              <span style={{ fontSize:18 }}>{n.icon}</span>
              <span style={{ fontWeight:tab===n.id?600:400 }}>{n.label}</span>
            </button>
          ))}
        </div>

        {/* Contenido */}
        <div style={{ flex:1, overflowY:'auto', padding:'28px 30px' }}>
          {tab === 'vehiculos' && <MisVehiculos user={user} toast={toast}/>}
          {tab === 'cuenta'    && <MiCuenta    user={user} toast={toast} onLogout={onLogout}/>}
        </div>
      </div>
    </div>
  );
}
