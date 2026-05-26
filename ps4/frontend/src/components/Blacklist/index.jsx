import { useState, useEffect } from "react";
import { T, F, fmtDT } from "../../utils";
import { Btn, PrimaryBtn, Modal, Empty, Lbl, Badge, Spinner } from "../UI";
import { useConfirm } from "../UI/ErrorBoundary";
import { useApp } from "../../context/AppContext";
import * as API from "../../api";

export default function Blacklist({ toast }) {
  const { user } = useApp();
  const isAdmin = user?.role === 'admin' || user?.role === 'vigilante';
  const { confirm, ConfirmDialog } = useConfirm();
  const [list,    setList]  = useState([]);
  const [loading, setL]     = useState(true);
  const [modal,   setModal] = useState(false);
  const [form,    setForm]  = useState({ placa: '', razon: 'otro', motivo: '' });

const load = async () => {
    setL(true);
    try {
      const d = await API.listaNegra.list();
      setList(Array.isArray(d) ? d : d.results || []);
    } catch {}
    finally { setL(false); }
  };
  useEffect(() => { load(); }, []);

  const add = async () => {
    if (!form.placa || !form.motivo) { toast('Placa y motivo requeridos', 'error'); return; }
    try {
      await API.listaNegra.add(form);
      toast(`🚫 ${form.placa.toUpperCase()} bloqueado — admins notificados vía WebSocket`, 'success');
      setModal(false);
      setForm({ placa: '', razon: 'otro', motivo: '' });
      load();
    } catch (e) { toast(e.placa?.[0] || e.error || 'Error', 'error'); }
  };

  const remove = async (id, placa) => {
    // ← useConfirm en vez de window.confirm
    const ok = await confirm({
      title: `¿Eliminar ${placa} de la lista negra?`,
      msg: 'El vehículo podrá volver a ingresar al campus sin restricciones.',
      danger: true,
    });
    if (!ok) return;
    try { await API.listaNegra.remove(id); toast(`${placa} eliminado de lista negra`, 'success'); load(); }
    catch { toast('Error al eliminar', 'error'); }
  };

  return (
    <div>
      {ConfirmDialog}

      <div style={{ marginBottom: 16, padding: '13px 17px', background: 'rgba(255,61,61,.04)', border: `1px solid ${T.red}25`, borderRadius: 11, display: 'flex', gap: 12 }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>🚫</span>
        <div style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.6 }}>
          Vehículos bloqueados automáticamente al intentar ingresar. Se genera una
          <strong style={{ color: T.red }}> alerta push en tiempo real </strong>
          para todos los administradores vía WebSocket.
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ fontFamily: F.mono, fontSize: 10, color: T.muted }}>
          {list.length} vehículo{list.length !== 1 ? 's' : ''} bloqueado{list.length !== 1 ? 's' : ''}
        </div>
        {isAdmin && <Btn onClick={() => setModal(true)} color={T.red}>🚫 Agregar a Lista Negra</Btn>}
      </div>

      {loading
        ? <div style={{ textAlign: 'center', padding: 40 }}><Spinner /></div>
        : list.length === 0
          ? <Empty icon="✅" msg="Lista negra vacía" />
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {list.map(b => (
                <div key={b.id} className="fadeUp" style={{ background: T.card, border: `1px solid rgba(255,61,61,.2)`, borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 52, height: 52, borderRadius: 11, background: 'rgba(255,61,61,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, border: '1px solid rgba(255,61,61,.18)' }}>🚫</div>
                    <div>
                      <div style={{ fontFamily: F.mono, fontSize: 20, fontWeight: 700, color: T.red, letterSpacing: 4 }}>{b.placa}</div>
                      <div style={{ display: 'flex', gap: 7, marginTop: 5 }}>
                        <Badge color={T.red}>{b.razon}</Badge>
                        {b.vehiculo_info && <span style={{ fontSize: 11, color: T.muted }}>{b.vehiculo_info.propietario}</span>}
                      </div>
                      <div style={{ fontSize: 13, color: T.text, marginTop: 5 }}>{b.motivo}</div>
                      <div style={{ fontSize: 10, color: T.muted, marginTop: 3 }}>
                        Por {b.agregado_por_nombre} · {fmtDT(b.agregado_en)}
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <Btn onClick={() => remove(b.id, b.placa)} color={T.green}>Eliminar</Btn>
                  )}
                </div>
              ))}
            </div>
          )
      }

      {modal && (
        <Modal onClose={() => setModal(false)} title="🚫 Agregar a Lista Negra">
          <div style={{ marginBottom: 13 }}>
            <Lbl c="Placa *" />
            <input value={form.placa} maxLength={6}
              style={{ fontFamily: F.mono, letterSpacing: 6, fontSize: 24, textAlign: 'center' }}
              onChange={e => setForm(p => ({ ...p, placa: e.target.value.toUpperCase() }))}
              placeholder="ABC123" />
          </div>
          <div style={{ marginBottom: 13 }}>
            <Lbl c="Razón del bloqueo" />
            <select value={form.razon} onChange={e => setForm(p => ({ ...p, razon: e.target.value }))}>
              <option value="robo">Vehículo reportado como robado</option>
              <option value="deuda">Deuda pendiente con la institución</option>
              <option value="sancion">Sanción disciplinaria</option>
              <option value="otro">Otro motivo</option>
            </select>
          </div>
          <div style={{ marginBottom: 18 }}>
            <Lbl c="Descripción detallada *" />
            <textarea value={form.motivo} onChange={e => setForm(p => ({ ...p, motivo: e.target.value }))}
              placeholder="Describe el motivo del bloqueo con el mayor detalle posible..." />
          </div>
          <div style={{ display: 'flex', gap: 9 }}>
            <PrimaryBtn onClick={add} full color={T.red}>🚫 Confirmar Bloqueo</PrimaryBtn>
            <Btn onClick={() => setModal(false)} color={T.muted}>Cancelar</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}