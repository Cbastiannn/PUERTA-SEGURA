import { useState, useEffect } from "react";
import { T, F, fmtDT } from "../../utils";
import { Table, Btn, PrimaryBtn, Modal, Empty, Lbl, Badge, TD } from "../UI";
import { useConfirm } from "../UI/ErrorBoundary";
import * as API from "../../api";
export default function Users({ toast }) {
  const { confirm, ConfirmDialog } = useConfirm();
  const [list, setList] = useState([]); const [loading, setL] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ username: '', first_name: '', last_name: '', email: '', password: '', role: 'vigilante', access_point: 'Entrada Principal', phone: '' });
  const [passModal, setPM] = useState(null); const [newPass, setNP] = useState('');
  const load = async () => { setL(true); try { const d = await API.users.list(); setList(Array.isArray(d) ? d : d.results || []); } catch {} finally { setL(false); } };
  useEffect(() => { load(); }, []);
  const submit = async () => {
    try { await API.users.create(form); toast('✅ Usuario creado', 'success'); setModal(null); setForm({ username: '', first_name: '', last_name: '', email: '', password: '', role: 'vigilante', access_point: 'Entrada Principal', phone: '' }); load(); }
    catch (e) { toast(e.email?.[0] || e.error || 'Error', 'error'); }
  };
  const toggle = async (id, n, active) => {
    const ok = await confirm({
      title: active ? `¿Desactivar a ${n}?` : `¿Activar a ${n}?`,
      msg: active ? 'El usuario no podrá iniciar sesión hasta que sea reactivado.' : 'El usuario podrá iniciar sesión nuevamente.',
      danger: active,
    });
    if (!ok) return;
    try { await API.users.toggleActive(id); toast(`Estado de ${n} actualizado`, 'success'); load(); } catch { toast('Error', 'error'); }
  };
  const reset = async () => {
    if (newPass.length < 8) { toast('Mínimo 8 caracteres', 'error'); return; }
    try { await API.users.resetPassword(passModal.id, newPass); toast('✅ Contraseña actualizada', 'success'); setPM(null); setNP(''); } catch { toast('Error', 'error'); }
  };
  const rows = list.map(u => (
    <tr key={u.id} style={{ opacity: u.is_active ? 1 : .5 }} onMouseOver={e => e.currentTarget.style.background = 'rgba(0,180,255,.03)'} onMouseOut={e => e.currentTarget.style.background = ''}>
      <TD><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: 8, background: u.role === 'admin' ? 'rgba(255,215,0,.1)' : 'rgba(0,180,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.head, fontWeight: 700, fontSize: 12, color: u.role === 'admin' ? T.yellow : T.blue, border: `1px solid ${u.role === 'admin' ? T.yellow : T.blue}25`, flexShrink: 0 }}>{u.avatar_initials}</div>
        <div><div style={{ fontSize: 12, color: T.head, fontWeight: 600 }}>{u.full_name}</div><div style={{ fontSize: 10, color: T.muted }}>{u.email}</div></div>
      </div></TD>
      <TD><Badge color={u.role === 'admin' ? T.yellow : T.blue}>{u.role === 'admin' ? '🔑 Admin' : '👁️ Vigilante'}</Badge></TD>
      <TD s={{ fontSize: 11, color: T.muted }}>{u.access_point}</TD>
      <TD s={{ fontSize: 11, color: T.muted }}>{u.phone || '—'}</TD>
      <TD><Badge color={u.is_active ? T.green : T.red}>{u.is_active ? '● Activo' : '○ Inactivo'}</Badge></TD>
      <TD s={{ fontFamily: F.mono, fontSize: 10, color: T.muted }}>{fmtDT(u.last_activity)}</TD>
      <TD><div style={{ display: 'flex', gap: 5 }}>
        <Btn sm onClick={() => setPM(u)} color={T.cyan} title="Reset contraseña">🔑</Btn>
        <Btn sm onClick={() => toggle(u.id, u.full_name, u.is_active)} color={u.is_active ? T.red : T.green}>{u.is_active ? '↓ Off' : '↑ On'}</Btn>
      </div></TD>
    </tr>
  ));
  return (
    <div>
      {ConfirmDialog}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}><PrimaryBtn onClick={() => setModal('add')}>+ Crear Usuario</PrimaryBtn></div>
      <Table heads={[{ c: 'Usuario' }, { c: 'Rol', w: 120 }, { c: 'Punto de Acceso' }, { c: 'Teléfono', w: 120 }, { c: 'Estado', w: 95 }, { c: 'Última Actividad', w: 145 }, { c: 'Acciones', w: 130 }]} rows={rows} loading={loading} empty={<Empty icon="👤" msg="Sin usuarios" />} />
      {modal === 'add' && <Modal onClose={() => setModal(null)} title="👤 Crear Usuario">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
          <div><Lbl c="Nombre" /><input value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} placeholder="Nombre" /></div>
          <div><Lbl c="Apellido" /><input value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} placeholder="Apellido" /></div>
          <div style={{ gridColumn: 'span 2' }}><Lbl c="Correo *" /><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value, username: e.target.value.split('@')[0] }))} placeholder="correo@ucundinamarca.edu.co" /></div>
          <div><Lbl c="Contraseña * (mín. 8)" /><input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder="••••••••" /></div>
          <div><Lbl c="Teléfono" /><input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="3101234567" /></div>
          <div><Lbl c="Rol" /><select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}><option value="vigilante">👁️ Vigilante</option><option value="admin">🔑 Admin</option></select></div>
          <div><Lbl c="Punto de Acceso" /><input value={form.access_point} onChange={e => setForm(p => ({ ...p, access_point: e.target.value }))} placeholder="Entrada Principal" /></div>
        </div>
        <div style={{ display: 'flex', gap: 9, marginTop: 16 }}><PrimaryBtn onClick={submit} full>✓ Crear Usuario</PrimaryBtn><Btn onClick={() => setModal(null)} color={T.muted}>Cancelar</Btn></div>
      </Modal>}
      {passModal && <Modal onClose={() => { setPM(null); setNP(''); }} title={`🔑 Reset contraseña — ${passModal.full_name}`}>
        <Lbl c="Nueva contraseña (mín. 8)" />
        <input type="password" value={newPass} onChange={e => setNP(e.target.value)} placeholder="••••••••" style={{ marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 9 }}><PrimaryBtn onClick={reset} full color={T.cyan}>✓ Cambiar</PrimaryBtn><Btn onClick={() => { setPM(null); setNP(''); }} color={T.muted}>Cancelar</Btn></div>
      </Modal>}
    </div>
  );
}
