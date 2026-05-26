import { useState } from "react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { T, F, fmtD } from "../../utils";
import { Card, StatCard, Btn, PrimaryBtn, Empty, Spinner } from "../UI";
import * as API from "../../api";
export default function Reports({ toast }) {
  const today = new Date().toISOString().split('T')[0];
  const month = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [desde, setDesde] = useState(month); const [hasta, setHasta] = useState(today);
  const [data, setData] = useState(null); const [loading, setL] = useState(false);
  const load = async () => {
    setL(true); setData(null);
    try { setData(await API.reporte.get(desde, hasta)); toast('Reporte generado', 'success'); }
    catch { toast('Error generando reporte', 'error'); }
    finally { setL(false); }
  };
  const pct = data ? Math.round((data.autorizados / Math.max(data.total_accesos, 1)) * 100) : 0;
  return (
    <div>
      <Card style={{ padding: 20, marginBottom: 18 }}>
        <div style={{ fontFamily: F.head, fontSize: 16, fontWeight: 700, color: T.head, marginBottom: 16 }}>📈 Reporte Ejecutivo por Período</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: 2.5, fontFamily: F.mono, marginBottom: 6, textTransform: 'uppercase' }}>Desde</div>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: 2.5, fontFamily: F.mono, marginBottom: 6, textTransform: 'uppercase' }}>Hasta</div>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
          </div>
          <PrimaryBtn onClick={load} loading={loading}>📊 Generar Reporte</PrimaryBtn>
        </div>
      </Card>
      {loading && <div style={{ textAlign: 'center', padding: 60 }}><Spinner size={40} /><div style={{ fontFamily: F.mono, fontSize: 11, color: T.muted, marginTop: 12 }}>Calculando reporte...</div></div>}
      {data && !loading && <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(155px,1fr))', gap: 12 }}>
          {[['TOTAL ACCESOS', data.total_accesos, T.blue, '📊'], ['AUTORIZADOS', data.autorizados, T.green, '✅'], ['DENEGADOS', data.denegados, T.red, '🚫'], ['VEHÍCULOS ÚNICOS', data.vehiculos_unicos, T.purple, '🚗'], ['NUEVOS VEHÍCULOS', data.nuevos_vehiculos, T.cyan, '➕'], ['NUEVOS VISITANTES', data.nuevos_visitantes, T.orange, '👥']].map(([l, v, c, i], idx) => <StatCard key={idx} label={l} value={v} color={c} icon={i} />)}
        </div>
        <Card style={{ padding: 20 }}>
          <div style={{ fontFamily: F.head, fontSize: 14, fontWeight: 600, color: T.head, marginBottom: 12 }}>Tasa de Autorización</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ fontFamily: F.head, fontSize: 56, fontWeight: 700, color: pct > 80 ? T.green : pct > 60 ? T.orange : T.red }}>{pct}%</div>
            <div style={{ flex: 1 }}>
              <div style={{ height: 16, borderRadius: 99, background: 'rgba(255,255,255,.06)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: 99, background: pct > 80 ? T.green : pct > 60 ? T.orange : T.red, width: `${pct}%`, transition: 'width 1.2s ease', boxShadow: `0 0 12px ${pct > 80 ? T.green : T.red}60` }} />
              </div>
              <div style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>{data.autorizados} autorizados de {data.total_accesos} totales</div>
            </div>
          </div>
        </Card>
        <Card style={{ padding: 20 }}>
          <div style={{ fontFamily: F.head, fontSize: 14, fontWeight: 600, color: T.head, marginBottom: 14 }}>Accesos por día</div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data.por_dia || []}>
              <defs><linearGradient id="rG" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={T.purple} stopOpacity={.3} /><stop offset="95%" stopColor={T.purple} stopOpacity={0} /></linearGradient></defs>
              <XAxis dataKey="dia" tick={{ fill: T.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: T.card2, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="total" stroke={T.purple} strokeWidth={2} fill="url(#rG)" name="Accesos" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>}
    </div>
  );
}
