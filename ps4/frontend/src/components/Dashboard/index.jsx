import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { T, F, PIE_COLORS } from "../../utils";
import { Card, StatCard, Empty } from "../UI";
import { useApp } from "../../context/AppContext";
import * as API from "../../api";

// ── Heatmap de calor (GitHub-style) ────────────────────────────
function HeatMap() {
  const [data, setData] = useState(null);
  const [loading, setL] = useState(true);
  const [tooltip, setTT] = useState(null);

  useEffect(() => {
    API.stats.heatmap().then(d => { setData(d); setL(false); }).catch(() => setL(false));
  }, []);

  if (loading) return <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ color: T.muted, fontFamily: F.mono, fontSize: 11 }}>Cargando heatmap...</div></div>;
  if (!data) return null;

  const { matrix = data.data, max = data.max, dias = data.dias } = data;
  const HORAS = Array.from({ length: 16 }, (_, i) => i + 6); // 6h → 21h
  const CELL = 18;
  const GAP  = 2;

  const color = (val) => {
    if (val === 0) return 'rgba(0,180,255,.06)';
    const pct = val / Math.max(max, 1);
    if (pct < 0.2)  return 'rgba(0,180,255,.25)';
    if (pct < 0.4)  return 'rgba(0,180,255,.45)';
    if (pct < 0.6)  return 'rgba(0,180,255,.65)';
    if (pct < 0.8)  return 'rgba(0,212,200,.8)';
    return T.green;
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
        {/* Labels de días */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: GAP, paddingTop: CELL + GAP + 4 }}>
          {dias.map((d, i) => (
            <div key={i} style={{ height: CELL, display: 'flex', alignItems: 'center', fontFamily: F.mono, fontSize: 9, color: T.muted, width: 28 }}>{d}</div>
          ))}
        </div>
        {/* Grid */}
        <div style={{ flex: 1 }}>
          {/* Labels de horas */}
          <div style={{ display: 'flex', gap: GAP, marginBottom: 4, paddingLeft: 1 }}>
            {HORAS.map((h, i) => (
              <div key={i} style={{ width: CELL, textAlign: 'center', fontFamily: F.mono, fontSize: 8, color: T.muted }}>{h % 3 === 0 ? `${h}h` : ''}</div>
            ))}
          </div>
          {/* Celdas */}
          {Array.from({ length: 7 }, (_, dia) => (
            <div key={dia} style={{ display: 'flex', gap: GAP, marginBottom: GAP }}>
              {HORAS.map((hora) => {
                const cell = matrix.find(r => r.dia === dia && r.hora === hora);
                const val  = cell?.total || 0;
                return (
                  <div key={hora}
                    onMouseEnter={(e) => setTT({ dia: dias[dia], hora, val, x: e.clientX, y: e.clientY })}
                    onMouseLeave={() => setTT(null)}
                    style={{ width: CELL, height: CELL, borderRadius: 3, background: color(val), cursor: val > 0 ? 'pointer' : 'default', transition: 'transform .15s', border: `1px solid rgba(0,180,255,.08)` }}
                    onMouseOver={e => { if (val > 0) e.currentTarget.style.transform = 'scale(1.25)'; }}
                    onMouseOut={e => { e.currentTarget.style.transform = ''; }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div style={{ position: 'fixed', left: tooltip.x + 12, top: tooltip.y - 36, background: T.card2, border: `1px solid ${T.border}`, borderRadius: 7, padding: '6px 10px', fontFamily: F.mono, fontSize: 11, color: T.text, zIndex: 999, pointerEvents: 'none', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,.4)' }}>
          {tooltip.dia} {tooltip.hora}:00 — <span style={{ color: T.blue, fontWeight: 700 }}>{tooltip.val} acceso{tooltip.val !== 1 ? 's' : ''}</span>
        </div>
      )}

      {/* Leyenda */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, justifyContent: 'flex-end' }}>
        <span style={{ fontFamily: F.mono, fontSize: 9, color: T.muted }}>Menos</span>
        {[0,.2,.4,.6,.8,1].map((p, i) => (
          <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: color(p * max) }} />
        ))}
        <span style={{ fontFamily: F.mono, fontSize: 9, color: T.muted }}>Más</span>
      </div>
    </div>
  );
}

// ── Dashboard principal ─────────────────────────────────────────
export default function Dashboard({ toast }) {
  const { wsStats } = useApp();
  const [data,    setData]   = useState(null);
  const [loading, setL]      = useState(true);
  const [heatTab, setHeatTab]= useState('bars'); // 'bars' | 'heat'

  const load = useCallback(async () => {
    try { setData(await API.stats.get()); }
    catch { toast('Error cargando estadísticas', 'error'); }
    finally { setL(false); }
  }, [toast]);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  // Fusionar datos del WebSocket con los del polling
  const merged = wsStats ? { ...data, ...wsStats } : data;

  if (loading) return (
    <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 13 }}>
      {Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, height: 108, animation: 'pulse 1.8s infinite' }} />)}
    </div>
  );
  if (!merged) return null;

  const hourData = Array.from({ length: 19 }, (_, i) => {
    const h = i + 5;
    const f = (merged.por_hora || []).find(x => x.hora === h);
    return { h: `${h}h`, v: f ? f.total : 0 };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* Alertas */}
      {(merged.alertas_permanencia || []).length > 0 && (
        <div className="fadeUp" style={{ background: 'rgba(255,215,0,.05)', border: `1px solid ${T.yellow}35`, borderRadius: 12, padding: '14px 18px', display: 'flex', gap: 12 }}>
          <div style={{ fontSize: 22, flexShrink: 0 }}>⚠️</div>
          <div>
            <div style={{ fontFamily: F.head, fontSize: 15, fontWeight: 700, color: T.yellow, marginBottom: 8 }}>
              PERMANENCIA PROLONGADA — {merged.alertas_permanencia.length} vehículo{merged.alertas_permanencia.length !== 1 ? 's' : ''}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {merged.alertas_permanencia.map((v, i) => (
                <div key={i} style={{ background: `${T.yellow}10`, border: `1px solid ${T.yellow}28`, borderRadius: 7, padding: '5px 11px', fontSize: 11 }}>
                  <span style={{ fontFamily: F.mono, color: T.yellow, fontWeight: 700 }}>{v.placa}</span>
                  <span style={{ color: T.muted, marginLeft: 6 }}>{v.propietario} · {v.horas}h</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 13 }}>
        {[
          { label: 'VEHÍCULOS',    value: merged.vehiculos_totales,         sub: `${merged.vehiculos_activos} activos`,   color: T.blue,   icon: '🚗' },
          { label: 'ACCESOS HOY', value: merged.accesos_hoy,               sub: `${merged.autorizados_hoy} autorizados`, color: T.green,  icon: '✅', pct: merged.cambio_porcentaje },
          { label: 'DENEGADOS',   value: merged.denegados_hoy,             sub: 'rechazados hoy',                        color: T.red,    icon: '🚫' },
          { label: 'EN CAMPUS',   value: merged.en_campus,                 sub: `${(merged.alertas_permanencia||[]).length} alertas`, color: T.purple, icon: '🏫' },
          { label: 'VISITANTES',  value: merged.visitantes_activos,        sub: 'activos',                               color: T.orange, icon: '👥' },
          { label: 'LISTA NEGRA', value: merged.en_lista_negra,            sub: 'bloqueados',                            color: T.yellow, icon: '⚠️' },
          { label: 'QR VENCEN',   value: merged.vehiculos_proximos_vencer, sub: 'en 30 días',                           color: T.cyan,   icon: '⏱️' },
          { label: 'NOTIFICACIONES', value: merged.notificaciones_no_leidas, sub: 'no leídas',                         color: T.pink,   icon: '🔔' },
        ].map((s, i) => <StatCard key={i} {...s} />)}
      </div>

      {/* Gráfica principal con toggle */}
      <Card style={{ padding: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <div style={{ fontFamily: F.head, fontSize: 14, fontWeight: 600, color: T.head }}>
            {heatTab === 'bars' ? 'Accesos por hora (hoy)' : 'Mapa de calor — tráfico 90 días'}
          </div>
          <div style={{ display: 'flex', background: T.card2, border: `1px solid ${T.border}`, borderRadius: 7, overflow: 'hidden' }}>
            {[['bars','📊 Horas'],['heat','🌡️ Heatmap']].map(([v,l]) => (
              <button key={v} onClick={() => setHeatTab(v)}
                style={{ padding: '6px 14px', fontSize: 11, border: 'none', cursor: 'pointer', background: heatTab === v ? T.blue : 'transparent', color: heatTab === v ? '#000' : T.muted, fontFamily: F.head, fontWeight: 600, transition: 'all .2s' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
        {heatTab === 'bars' ? (
          <ResponsiveContainer width="100%" height={185}>
            <BarChart data={hourData} barSize={11}>
              <XAxis dataKey="h" tick={{ fill: T.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: T.card2, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11 }} />
              <Bar dataKey="v" fill={T.blue} radius={[4, 4, 0, 0]} name="Accesos" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <HeatMap />
        )}
      </Card>

      {/* Tendencia + tipo + top placas */}
      <div className="chart-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 14 }}>
        <Card style={{ padding: 18 }}>
          <div style={{ fontFamily: F.head, fontSize: 14, fontWeight: 600, color: T.head, marginBottom: 14 }}>Tendencia 14 días</div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={merged.por_dia || []}>
              <defs>
                <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={T.blue} stopOpacity={.25} />
                  <stop offset="95%" stopColor={T.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="dia" tick={{ fill: T.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: T.muted, fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: T.card2, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="total" stroke={T.blue} strokeWidth={2} fill="url(#aG)" dot={false} name="Accesos" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: 18 }}>
          <div style={{ fontFamily: F.head, fontSize: 14, fontWeight: 600, color: T.head, marginBottom: 14 }}>Por tipo</div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={(merged.por_tipo || []).map(t => ({ name: t.tipo, value: t.total }))}
                cx="50%" cy="50%" innerRadius={38} outerRadius={62} dataKey="value">
                {(merged.por_tipo || []).map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: T.card2, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11 }} />
              <Legend iconSize={7} wrapperStyle={{ fontSize: 9, color: T.muted }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card style={{ padding: 18 }}>
          <div style={{ fontFamily: F.head, fontSize: 14, fontWeight: 600, color: T.head, marginBottom: 14 }}>Top 5 placas</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(merged.top_placas || []).map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontFamily: F.mono, fontSize: 9, color: T.muted, width: 14, textAlign: 'right' }}>{i+1}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: F.mono, fontSize: 10, color: T.blue, fontWeight: 700 }}>{p.placa}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 9, color: T.muted }}>{p.total}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 99, background: 'rgba(0,180,255,.1)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 99, background: PIE_COLORS[i], width: `${Math.round((p.total / ((merged.top_placas[0]?.total) || 1)) * 100)}%`, transition: 'width 1s ease' }} />
                  </div>
                </div>
              </div>
            ))}
            {!(merged.top_placas?.length) && <Empty icon="📊" msg="Sin datos todavía" />}
          </div>
        </Card>
      </div>
    </div>
  );
}
