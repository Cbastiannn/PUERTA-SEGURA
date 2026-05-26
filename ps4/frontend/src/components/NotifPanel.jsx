import { useState, useEffect } from "react";
import { T, F, fmtDT } from "../utils";
import { Btn, Spinner, Empty } from "./UI";
import * as API from "../api";
export default function NotifPanel({ onClose, toast, onCountChange }) {
  const [list, setL] = useState([]);
  const [loading, setLd] = useState(true);
  const load = async () => { try { const d = await API.notificaciones.list(); const a = Array.isArray(d) ? d : d.results || []; setL(a); onCountChange(a.filter(n => !n.leida).length); } catch {} finally { setLd(false); } };
  useEffect(() => { load(); }, []);
  const marcar = async () => { try { await API.notificaciones.marcarTodas(); toast('Marcadas como leídas', 'success'); load(); } catch {} };
  const TC = { alerta: T.red, info: T.blue, error: T.red, exito: T.green };
  return (
    <div className="fadeIn" onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 500, pointerEvents: 'none' }}>
      <div style={{ position: 'absolute', right: 14, top: 52, width: 360, background: T.card, border: `1px solid ${T.borderHov}`, borderRadius: 13, overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,.5)', pointerEvents: 'all' }}>
        <div style={{ padding: '13px 17px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: F.head, fontSize: 15, fontWeight: 700, color: T.head }}>🔔 Notificaciones</div>
          <div style={{ display: 'flex', gap: 7 }}><Btn sm onClick={marcar} color={T.muted}>Leídas</Btn><Btn sm onClick={onClose} color={T.muted}>✕</Btn></div>
        </div>
        <div style={{ maxHeight: 360, overflowY: 'auto' }}>
          {loading ? <div style={{ padding: 20, textAlign: 'center' }}><Spinner /></div>
            : list.length === 0 ? <Empty icon="✅" msg="Sin notificaciones" />
            : list.map(n => (
              <div key={n.id} style={{ padding: '11px 17px', borderBottom: `1px solid ${T.border}`, background: n.leida ? 'transparent' : 'rgba(0,180,255,.03)' }}>
                <div style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: n.leida ? 'transparent' : TC[n.tipo] || T.blue, flexShrink: 0, marginTop: 5 }} />
                  <div>
                    <div style={{ fontSize: 12.5, color: n.leida ? T.muted : T.text, fontWeight: n.leida ? 400 : 600 }}>{n.titulo}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{n.mensaje}</div>
                    <div style={{ fontSize: 9.5, color: T.muted, marginTop: 3, fontFamily: F.mono }}>{fmtDT(n.creada_en)}</div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
