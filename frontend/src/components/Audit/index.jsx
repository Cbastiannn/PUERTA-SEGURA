import { useState, useEffect, useCallback } from "react";
import { T, F, fmtDT } from "../../utils";
import { Table, Btn, Empty, Badge, Card, TD } from "../UI";
import { usePagination, useDebounce } from "../../hooks";
import * as API from "../../api";

export default function Audit({ toast }) {
  const [data,    setData]    = useState({ results: [], count: 0, total_pages: 1 });
  const [loading, setL]       = useState(true);
  const [search,  setSearch]  = useState('');
  const [fAccion, setFA]      = useState('');
  const [fOk,     setFO]      = useState('');
  const [page, setPage, resetPage] = usePagination();
  const dSearch = useDebounce(search, 400);

  const buildQ = useCallback(() => {
    const p = new URLSearchParams({ page });
    if (dSearch) p.append('search', dSearch);
    if (fAccion) p.append('accion', fAccion);
    if (fOk !== '') p.append('exitoso', fOk);
    return p.toString();
  }, [page, dSearch, fAccion, fOk]);

  const load = useCallback(async () => {
    setL(true);
    try { setData(await API.auditoria.list(buildQ())); }
    catch { toast('Error cargando auditoría', 'error'); }
    finally { setL(false); }
  }, [buildQ, toast]);

  // FIX #6: useEffect correcto, no useState con callback
  useEffect(() => { load(); }, [load]);

  const exportExcel = async () => {
    try { await API.auditoria.exportarExcel(); toast('✅ Excel de auditoría descargado', 'success'); }
    catch { toast('Error al exportar', 'error'); }
  };

  const ACCIONES = ['login','logout','login_failed','locked','vehiculo_creado','vehiculo_modificado','acceso_autorizado','acceso_denegado','lista_negra_agregado','lista_negra_removido','barrera_abierta','barrera_cerrada','usuario_creado','usuario_modificado'];
  const AC = { login:T.green, logout:T.muted, login_failed:T.red, locked:T.red, vehiculo_creado:T.blue, vehiculo_modificado:T.blue, acceso_autorizado:T.green, acceso_denegado:T.red, lista_negra_agregado:T.red, lista_negra_removido:T.green, barrera_abierta:T.green, barrera_cerrada:T.orange, usuario_creado:T.purple, usuario_modificado:T.purple };

  const rows = (data.results || []).map(a => (
    <tr key={a.id}
      onMouseOver={e => e.currentTarget.style.background = 'rgba(0,180,255,.03)'}
      onMouseOut={e => e.currentTarget.style.background = ''}>
      <TD s={{ fontFamily: F.mono, fontSize: 10, color: T.muted, whiteSpace: 'nowrap' }}>{fmtDT(a.timestamp)}</TD>
      <TD s={{ fontSize: 12, color: T.text }}>{a.usuario_nombre}</TD>
      <TD><Badge color={AC[a.accion] || T.muted}>{a.accion.replace(/_/g, ' ')}</Badge></TD>
      <TD s={{ fontSize: 11, color: T.muted, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={a.detalle}>{a.detalle || '—'}</TD>
      <TD s={{ fontFamily: F.mono, fontSize: 10, color: T.muted }}>{a.ip_address || '—'}</TD>
      <TD><Badge color={a.exitoso ? T.green : T.red}>{a.exitoso ? '✓ OK' : '✗ Error'}</Badge></TD>
    </tr>
  ));

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.muted, fontSize: 12 }}>🔍</span>
          <input value={search} onChange={e => { setSearch(e.target.value); resetPage(); }}
            placeholder="Buscar usuario, detalle..." style={{ paddingLeft: 32 }} />
        </div>
        <select value={fAccion} onChange={e => { setFA(e.target.value); resetPage(); }} style={{ width: 200 }}>
          <option value="">Todas las acciones</option>
          {ACCIONES.map(a => <option key={a} value={a}>{a.replace(/_/g,' ')}</option>)}
        </select>
        <select value={fOk} onChange={e => { setFO(e.target.value); resetPage(); }} style={{ width: 130 }}>
          <option value="">Todos</option>
          <option value="true">✓ Exitosos</option>
          <option value="false">✗ Fallidos</option>
        </select>
        <div style={{ marginLeft: 'auto' }}>
          <Btn onClick={exportExcel} color={T.green}>📊 Exportar Excel</Btn>
        </div>
      </div>

      {/* Resumen rápido */}
      <Card style={{ padding: '10px 16px', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { l: 'Total registros', v: data.count, c: T.blue },
          ].map((s, i) => (
            <div key={i} style={{ fontFamily: F.mono, fontSize: 11 }}>
              <span style={{ color: T.muted }}>{s.l}: </span>
              <span style={{ color: s.c, fontWeight: 700 }}>{s.v}</span>
            </div>
          ))}
          <div style={{ fontFamily: F.mono, fontSize: 10, color: T.muted, marginLeft: 'auto' }}>
            Últimas 5.000 acciones · exportable a Excel
          </div>
        </div>
      </Card>

      <Table
        heads={[
          { c: 'Fecha/Hora', w: 135 },
          { c: 'Usuario' },
          { c: 'Acción', w: 185 },
          { c: 'Detalle' },
          { c: 'IP', w: 115 },
          { c: 'Resultado', w: 90 },
        ]}
        rows={rows}
        loading={loading}
        empty={<Empty icon="📋" msg="Sin registros de auditoría" />}
        pagination={{ page, total_pages: data.total_pages, count: data.count }}
        onPage={setPage}
      />
    </div>
  );
}
