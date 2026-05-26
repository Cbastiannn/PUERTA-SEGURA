import { useState, useEffect } from "react";
import { T, F, fmtDT } from "../../utils";
import { Btn, PrimaryBtn, Modal, Empty, Lbl, Badge, Spinner } from "../UI";
import { useConfirm } from "../UI/ErrorBoundary";
import * as API from "../../api";

export default function Visitors({ toast }) {
  const { confirm, ConfirmDialog } = useConfirm();
  const [list,    setList]  = useState([]);
  const [loading, setL]     = useState(true);
  const [modal,   setModal] = useState(false);
  const [form,    setForm]  = useState({ nombre: '', documento: '', placa: '', telefono: '', correo: '', anfitrion: '', dependencia: '', motivo: '' });

  const load = async () => {
    setL(true);
    try { const d = await API.visitantes.list(); setList(Array.isArray(d) ? d : d.results || []); }
    catch {} finally { setL(false); }
  };
  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.nombre.trim()) { toast('El nombre es requerido', 'error'); return; }
    try {
      await API.visitantes.create(form);
      toast(`✅ ${form.nombre} registrado en el campus`, 'success');
      setModal(false);
      setForm({ nombre: '', documento: '', placa: '', telefono: '', correo: '', anfitrion: '', dependencia: '', motivo: '' });
      load();
    } catch (e) { toast(e.error || 'Error', 'error'); }
  };

  const checkout = async (id, nombre, horas) => {
    const ok = await confirm({
      title: `¿Registrar salida de ${nombre}?`,
      msg: `Ha estado en el campus por ${horas} horas. Esta acción no se puede deshacer.`,
    });
    if (!ok) return;
    try { await API.visitantes.salida(id); toast(`Salida de ${nombre} registrada`, 'success'); load(); }
    catch { toast('Error al registrar salida', 'error'); }
  };

  const activos  = list.filter(v => !v.hora_salida).length;
  const cerrados = list.filter(v => v.hora_salida).length;

  return (
    <div>
      {ConfirmDialog}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontFamily: F.mono, fontSize: 10, color: T.muted }}>
          {activos} activo{activos !== 1 ? 's' : ''} · {cerrados} con salida
        </div>
        <PrimaryBtn onClick={() => setModal(true)} color={T.purple}>+ Registrar Visitante</PrimaryBtn>
      </div>

      {loading
        ? <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>
        : list.length === 0
          ? <Empty icon="👥" msg="Sin visitantes registrados hoy" />
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {list.map(v => (
                <div key={v.id} className="fadeUp" style={{ background: T.card, border: `1px solid ${v.en_alerta ? T.yellow + '44' : v.hora_salida ? T.border : T.purple + '30'}`, borderRadius: 11, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: v.hora_salida ? .6 : 1, gap: 14, transition: 'all .2s' }}>
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 46, height: 46, borderRadius: 10, background: v.hora_salida ? 'rgba(90,125,153,.08)' : 'rgba(164,100,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, border: `1px solid ${v.hora_salida ? T.border : T.purple + '25'}`, flexShrink: 0 }}>
                      👤
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: T.head }}>{v.nombre}</div>
                      <div style={{ display: 'flex', gap: 7, marginTop: 4, flexWrap: 'wrap' }}>
                        {v.placa && <Badge color={T.purple}>{v.placa}</Badge>}
                        {v.documento && <span style={{ fontSize: 10, color: T.muted }}>CC: {v.documento}</span>}
                      </div>
                      <div style={{ fontSize: 11, color: T.muted, marginTop: 4 }}>
                        Visita a: <strong style={{ color: T.text }}>{v.anfitrion}</strong>
                        {v.dependencia && ` · ${v.dependencia}`}
                        {v.motivo && <span> · {v.motivo}</span>}
                      </div>
                      <div style={{ fontSize: 10, color: v.en_alerta ? T.yellow : T.muted, marginTop: 3 }}>
                        Entrada: {fmtDT(v.hora_entrada)} · {v.horas_en_campus}h en campus
                        {v.en_alerta && ' ⚠️ PERMANENCIA PROLONGADA'}
                        {v.hora_salida && ` · Salida: ${fmtDT(v.hora_salida)}`}
                      </div>
                    </div>
                  </div>
                  {!v.hora_salida && (
                    <Btn onClick={() => checkout(v.id, v.nombre, v.horas_en_campus)} color={T.green}>
                      ✓ Registrar Salida
                    </Btn>
                  )}
                </div>
              ))}
            </div>
          )
      }

      {modal && (
        <Modal onClose={() => setModal(false)} title="👤 Registrar Visitante" width={600}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
            <div style={{ gridColumn: 'span 2' }}><Lbl c="Nombre Completo *" /><input value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre del visitante" autoFocus /></div>
            <div><Lbl c="Documento CC" /><input value={form.documento} onChange={e => setForm(p => ({ ...p, documento: e.target.value }))} placeholder="Número de cédula" /></div>
            <div><Lbl c="Placa Vehículo" /><input value={form.placa} onChange={e => setForm(p => ({ ...p, placa: e.target.value.toUpperCase() }))} placeholder="ABC123 (opcional)" /></div>
            <div><Lbl c="Teléfono" /><input value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} placeholder="3101234567" /></div>
            <div><Lbl c="Correo" /><input type="email" value={form.correo} onChange={e => setForm(p => ({ ...p, correo: e.target.value }))} placeholder="correo@ejemplo.com" /></div>
            <div><Lbl c="Persona a Visitar *" /><input value={form.anfitrion} onChange={e => setForm(p => ({ ...p, anfitrion: e.target.value }))} placeholder="Dr. García..." /></div>
            <div><Lbl c="Dependencia" /><input value={form.dependencia} onChange={e => setForm(p => ({ ...p, dependencia: e.target.value }))} placeholder="Sistemas, Rectoría..." /></div>
            <div style={{ gridColumn: 'span 2' }}><Lbl c="Motivo de la visita" /><input value={form.motivo} onChange={e => setForm(p => ({ ...p, motivo: e.target.value }))} placeholder="Reunión académica, trámite..." /></div>
          </div>
          <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
            <PrimaryBtn onClick={submit} full color={T.purple}>✓ Registrar Entrada</PrimaryBtn>
            <Btn onClick={() => setModal(false)} color={T.muted}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
