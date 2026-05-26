import { useState, useEffect, useCallback } from "react";
import { T, F, fmtDT } from "../../utils";
import { Table, Btn, Empty, Badge, TD } from "../UI";
import { usePagination, useDebounce, useSort } from "../../hooks";
import * as API from "../../api";

export default function History({ toast }) {
  const [data, setData] = useState({ results: [], count: 0, total_pages: 1 });
  const [loading, setL] = useState(true);
  const [fPlaca,  setFP]   = useState('');
  const [fProp,   setFPR]  = useState('');   // ← NUEVO: búsqueda por propietario
  const [fEstado, setFE]   = useState('');
  const [fMov,    setFM]   = useState('');
  const [fMetodo, setFMet] = useState('');
  const [fDesde,  setFD]   = useState('');
  const [fHasta,  setFH]   = useState('');
  const [page, setPage, resetPage] = usePagination();
  const { sortBy, toggle: toggleSort, indicator } = useSort('-timestamp');

  // Debounce en placa Y propietario — no dispara petición por cada tecla
  const dPlaca = useDebounce(fPlaca, 400);
  const dProp  = useDebounce(fProp,  400);

  const buildQ = useCallback(() => {
    const p = new URLSearchParams({ page });
    if (dPlaca)   p.append('placa', dPlaca);
    if (dProp)    p.append('search', dProp);  // search cubre propietario en el backend
    if (fEstado)  p.append('estado', fEstado);
    if (fMov)     p.append('movimiento', fMov);
    if (fMetodo)  p.append('metodo', fMetodo);
    if (fDesde)   p.append('desde', fDesde + 'T00:00:00');
    if (fHasta)   p.append('hasta', fHasta + 'T23:59:59');
    if (sortBy)   p.append('ordering', sortBy);
    return p.toString();
  }, [dPlaca, dProp, fEstado, fMov, fMetodo, fDesde, fHasta, page, sortBy]);

  const load = useCallback(async () => {
    setL(true);
    try { setData(await API.historial.list(buildQ())); }
    catch { toast('Error cargando historial', 'error'); }
    finally { setL(false); }
  }, [buildQ, toast]);

  useEffect(() => { load(); }, [load]);

  const exportPDF = async () => {
    if (!window.jspdf) {
      await new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        s.onload = res; s.onerror = rej; document.head.appendChild(s);
      });
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFillColor(4,9,15); doc.rect(0,0,300,220,'F');
    doc.setTextColor(0,180,255); doc.setFontSize(13); doc.setFont(undefined,'bold');
    doc.text('PUERTA SEGURA v3.0 — Historial de Accesos', 14, 14);
    doc.setTextColor(90,125,153); doc.setFontSize(8); doc.setFont(undefined,'normal');
    doc.text(`Universidad de Cundinamarca · ${new Date().toLocaleString('es-CO')} · ${data.count} registros`, 14, 22);
    const cols = ['Placa','Propietario','Movimiento','Método','Punto','Fecha y Hora','Estado'];
    const ws   = [22, 40, 22, 14, 36, 42, 22];
    let y = 32, x = 14;
    doc.setFontSize(7.5); doc.setFont(undefined,'bold'); doc.setTextColor(0,180,255);
    cols.forEach((c,i) => { doc.text(c, x, y); x += ws[i]; });
    y += 2; doc.setDrawColor(0,180,255); doc.setLineWidth(.3); doc.line(14,y,284,y); y += 5;
    doc.setFont(undefined,'normal');
    (data.results || []).forEach(h => {
      if (y > 196) { doc.addPage(); doc.setFillColor(4,9,15); doc.rect(0,0,300,220,'F'); y = 18; }
      x = 14;
      doc.setTextColor(...(h.estado==='Autorizado'?[0,200,140]:[255,80,80]));
      [h.placa, h.propietario.substring(0,22), h.movimiento, h.metodo,
       (h.punto_acceso||'').substring(0,18), fmtDT(h.timestamp), h.estado
      ].forEach((v,i) => { doc.text(String(v||''), x, y); x += ws[i]; });
      y += 6;
    });
    doc.save('historial-puerta-segura.pdf');
    toast('✅ PDF generado', 'success');
  };

  const clear = () => { setFP(''); setFPR(''); setFE(''); setFM(''); setFMet(''); setFD(''); setFH(''); resetPage(); };

  const rows = (data.results || []).map(h => (
    <tr key={h.id}
      onMouseOver={e => e.currentTarget.style.background = 'rgba(0,180,255,.03)'}
      onMouseOut={e => e.currentTarget.style.background = ''}>
      <TD s={{ fontFamily: F.mono, fontSize: 11, fontWeight: 700, color: T.blue }}>{h.placa}</TD>
      <TD s={{ fontSize: 12, color: T.text }}>{h.propietario}</TD>
      <TD>
        <Badge color={h.movimiento === 'Entrada' ? T.blue : h.movimiento === 'Salida' ? T.green : T.red}>
          {h.movimiento === 'Entrada' ? '↗' : h.movimiento === 'Salida' ? '↙' : '⚠'} {h.movimiento}
        </Badge>
      </TD>
      <TD><Badge color={h.metodo === 'QR' ? T.purple : T.cyan}>{h.metodo}</Badge></TD>
      <TD s={{ fontSize: 11, color: T.muted }}>{h.punto_acceso}</TD>
      <TD s={{ fontFamily: F.mono, fontSize: 10, color: T.muted }}>{fmtDT(h.timestamp)}</TD>
      <TD>
        <Badge color={h.estado === 'Autorizado' ? T.green : T.red}>
          {h.estado === 'Autorizado' ? '✓' : '✗'} {h.estado}
        </Badge>
      </TD>
    </tr>
  ));

  return (
    <div>
      {/* Barra de filtros — fila 1: búsquedas de texto */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 130 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.muted, fontSize: 12, pointerEvents: 'none' }}>🚗</span>
          <input value={fPlaca} onChange={e => { setFP(e.target.value.toUpperCase()); resetPage(); }}
            placeholder="Filtrar por placa..." style={{ paddingLeft: 32 }} />
        </div>
        {/* ← NUEVO: búsqueda por propietario */}
        <div style={{ position: 'relative', flex: 1, minWidth: 150 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.muted, fontSize: 12, pointerEvents: 'none' }}>👤</span>
          <input value={fProp} onChange={e => { setFPR(e.target.value); resetPage(); }}
            placeholder="Filtrar por propietario..." style={{ paddingLeft: 32 }} />
        </div>
      </div>

      {/* Barra de filtros — fila 2: selects y fechas */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { val: fEstado, set: setFE, opts: [['','Estado'],['Autorizado','✓ Autorizado'],['Denegado','✗ Denegado']], w: 165 },
          { val: fMov,    set: setFM, opts: [['','Movimiento'],['Entrada','↗ Entrada'],['Salida','↙ Salida'],['Intento','⚠ Intento']], w: 165 },
          { val: fMetodo, set: setFMet, opts: [['','Método'],['QR','📱 QR'],['Manual','⌨️ Manual']], w: 140 },
        ].map(({ val, set, opts, w }, i) => (
          <select key={i} value={val} onChange={e => { set(e.target.value); resetPage(); }} style={{ width: w }}>
            {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}

        <input type="date" value={fDesde} onChange={e => { setFD(e.target.value); resetPage(); }}
          style={{ width: 142 }} title="Desde" />
        <span style={{ color: T.muted, fontSize: 11 }}>→</span>
        <input type="date" value={fHasta} onChange={e => { setFH(e.target.value); resetPage(); }}
          style={{ width: 142 }} title="Hasta" />

        <Btn onClick={clear} color={T.muted} sm>✕ Limpiar</Btn>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 7 }}>
          <Btn onClick={() => API.historial.exportarExcel(buildQ())} color={T.green}>📊 Excel</Btn>
          <Btn onClick={() => API.historial.exportarCSV(buildQ())}   color={T.cyan}>📄 CSV</Btn>
          <Btn onClick={exportPDF} color={T.purple}>🖨️ PDF</Btn>
        </div>
      </div>

      <Table
        heads={[
          { c: 'Placa', w: 95, sortable: true,
            onSort: () => { toggleSort('placa'); resetPage(); },
            sortIndicator: indicator('placa') },
          { c: 'Propietario', sortable: true,
            onSort: () => { toggleSort('propietario'); resetPage(); },
            sortIndicator: indicator('propietario') },
          { c: 'Movimiento', w: 115 },
          { c: 'Método', w: 90 },
          { c: 'Punto', w: 150 },
          { c: 'Fecha y Hora', w: 140, sortable: true,
            onSort: () => { toggleSort('timestamp'); resetPage(); },
            sortIndicator: indicator('timestamp') },
          { c: 'Estado', w: 110 },
        ]}
        rows={rows}
        loading={loading}
        empty={<Empty icon="📋" msg="No hay registros con esos filtros" />}
        pagination={{ page, total_pages: data.total_pages, count: data.count }}
        onPage={setPage}
      />
    </div>
  );
}
