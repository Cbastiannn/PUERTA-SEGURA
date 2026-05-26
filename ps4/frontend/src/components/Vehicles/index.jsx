import { useState, useEffect, useCallback, useRef } from "react";
import { T, F, validatePlate } from "../../utils";
import { Table, Card, Btn, PrimaryBtn, Modal, Empty, Lbl, Badge, TD } from "../UI";
import { useApp } from "../../context/AppContext";
import { usePagination, useDebounce, useSort } from "../../hooks";
import * as API from "../../api";

export default function Vehicles({ toast }) {
  const { user } = useApp();
  const isAdmin = user?.role === 'admin' || user?.role === 'vigilante';
  const [data,    setData]    = useState({ results: [], count: 0, total_pages: 1 });
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [fActivo, setFA]      = useState('');
  const [fTipo,   setFT]      = useState('');
  const [view,    setView]    = useState('table');
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState({ placa: '', tipo: 'Automóvil', marca: '', modelo: '', color: '', propietario: '', documento: '', correo: '', telefono: '', notas: '' });
  const [saving,  setSaving]  = useState(false);
  const [pInfo,   setPInfo]   = useState(null);
  const [importing, setImp]   = useState(false);
  const fileRef = useRef(null);
  const [page, setPage, resetPage] = usePagination();
  const { sortBy, toggle: toggleSort, indicator } = useSort('-creado_en');
  const debouncedSearch = useDebounce(search, 400);

  const buildQ = useCallback(() => {
    const p = new URLSearchParams({ page });
    if (debouncedSearch) p.append('search', debouncedSearch);
    if (fActivo !== '')  p.append('activo', fActivo);
    if (fTipo)           p.append('tipo', fTipo);
    if (sortBy)          p.append('ordering', sortBy);
    return p.toString();
  }, [debouncedSearch, fActivo, fTipo, page, sortBy]);

  const load = useCallback(async () => {
    setLoading(true);
    try { setData(await API.vehiculos.list(buildQ())); }
    catch { toast('Error cargando vehículos', 'error'); }
    finally { setLoading(false); }
  }, [buildQ, toast]);

  useEffect(() => { load(); }, [load]);

  const submit = async () => {
    const pv = validatePlate(form.placa);
    if (!pv.valid) { toast('Formato de placa inválido', 'error'); return; }
    if (!form.propietario.trim()) { toast('Propietario requerido', 'error'); return; }
    setSaving(true);
    try {
      await API.vehiculos.create({ ...form, placa: pv.plate });
      toast(`✅ ${pv.plate} registrado`, 'success');
      setModal(null);
      setForm({ placa: '', tipo: 'Automóvil', marca: '', modelo: '', color: '', propietario: '', documento: '', correo: '', telefono: '', notas: '' });
      load();
    } catch (e) { toast(e.placa?.[0] || e.error || 'Error', 'error'); }
    finally { setSaving(false); }
  };

  const verQR    = async (id) => { try { setModal({ type: 'qr', qr: await API.vehiculos.qr(id) }); } catch { toast('Error', 'error'); } };
  const toggle   = async (id, p) => { try { await API.vehiculos.toggle(id); toast(`${p} actualizado`, 'success'); load(); } catch { toast('Error', 'error'); } };
  const renovar  = async (id, p) => { try { await API.vehiculos.renovarQR(id); toast(`QR de ${p} renovado`, 'success'); load(); } catch (e) { toast(e.error || 'Error', 'error'); } };
  const reenviar = async (id)   => { try { const r = await API.vehiculos.reenviarQR(id); toast(r.message, 'success'); } catch (e) { toast(e.error || 'Error', 'error'); } };
  const importar = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setImp(true);
    try { const r = await API.vehiculos.importarExcel(file); toast(`✅ ${r.creados} importados · ${r.errores?.length || 0} errores`, 'success'); r.errores?.forEach(er => toast(er, 'warning')); load(); }
    catch { toast('Error en importación', 'error'); }
    finally { setImp(false); e.target.value = ''; }
  };
  const printQR = (qr) => {
    const w = window.open('', '_blank', 'width=420,height=540');
    w.document.write(`<html><head><style>body{margin:0;padding:20px;background:#fff;font-family:sans-serif;text-align:center;}.plate{font-size:28px;font-weight:900;letter-spacing:6px;color:#00b4ff;margin:10px 0;}img{border:2px solid #eee;border-radius:8px;}</style></head><body>
      <div style="font-size:10px;color:#888;margin-bottom:8px;">🛡️ PUERTA SEGURA v3.0 · Universidad de Cundinamarca</div>
      <img src="${qr.qr_imagen_url}" width="200" height="200"/>
      <div class="plate">${qr.placa}</div>
      <div style="font-size:13px;color:#333;font-weight:600">${qr.propietario}</div>
      <div style="font-size:11px;color:#888;margin:4px 0">${qr.tipo} ${qr.marca}</div>
      <div style="font-size:10px;color:#aaa;margin-top:8px;border-top:1px solid #eee;padding-top:8px">Vigente ${qr.dias_vigencia} días · Vence ${new Date(qr.expira_en).toLocaleDateString('es-CO')}</div>
      <script>window.onload=()=>window.print();<\/script></body></html>`);
  };

  const TIPOS = ['Automóvil', 'Motocicleta', 'Camioneta', 'Bicicleta', 'Otro'];
  const rows = (data.results || []).map(v => (
    <tr key={v.id} style={{ opacity: v.activo ? 1 : .5 }}
      onMouseOver={e => e.currentTarget.style.background = 'rgba(0,180,255,.03)'}
      onMouseOut={e => e.currentTarget.style.background = ''}>
      <TD s={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: v.en_lista_negra ? T.red : T.blue }}>{v.placa}{v.en_lista_negra && ' 🚫'}</TD>
      <TD s={{ fontSize: 12, color: T.text }}>{v.propietario}</TD>
      <TD s={{ fontSize: 11, color: T.muted }}>{v.tipo}</TD>
      <TD s={{ fontSize: 11, color: T.muted }}>{[v.marca, v.modelo].filter(Boolean).join(' ') || '—'}</TD>
      <TD><Badge color={v.activo ? T.green : T.red}>{v.activo ? '● Activo' : '○ Inactivo'}</Badge></TD>
      <TD s={{ fontFamily: F.mono, fontSize: 10, color: v.dias_vigencia < 30 ? T.orange : T.muted }}>{v.dias_vigencia}d {v.dias_vigencia < 30 && '⚠'}</TD>
      <TD><div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        <Btn sm onClick={() => verQR(v.id)}>📱 QR</Btn>
        {isAdmin && <>
          <Btn sm onClick={() => toggle(v.id, v.placa)} color={v.activo ? T.red : T.green}>{v.activo ? 'Desactivar' : 'Activar'}</Btn>
          <Btn sm onClick={() => renovar(v.id, v.placa)} color={T.cyan} title="Renovar QR">🔄</Btn>
          {v.correo && <Btn sm onClick={() => reenviar(v.id)} color={T.purple} title="Reenviar QR">📧</Btn>}
        </>}
      </div></TD>
    </tr>
  ));

  return (
    <div>
      <div style={{ display: 'flex', gap: 9, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.muted }}>🔍</span>
          <input value={search} onChange={e => { setSearch(e.target.value); resetPage(); }} placeholder="Buscar placa, propietario, marca..." style={{ paddingLeft: 34 }} />
        </div>
        <select value={fActivo} onChange={e => { setFA(e.target.value); resetPage(); }} style={{ width: 130 }}>
          <option value="">Todos</option><option value="true">Activos</option><option value="false">Inactivos</option>
        </select>
        <select value={fTipo} onChange={e => { setFT(e.target.value); resetPage(); }} style={{ width: 150 }}>
          <option value="">Todos los tipos</option>
          {TIPOS.map(t => <option key={t}>{t}</option>)}
        </select>
        <div style={{ display: 'flex', background: T.card, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden' }}>
          {[['☰', 'table'], ['⊞', 'grid']].map(([icon, v]) => (
            <button key={v} onClick={() => setView(v)} style={{ padding: '8px 12px', background: view === v ? T.blue : 'transparent', color: view === v ? '#000' : T.muted, border: 'none', cursor: 'pointer', fontSize: 14, transition: 'all .2s' }}>{icon}</button>
          ))}
        </div>
        {isAdmin && <>
          <Btn onClick={() => API.vehiculos.exportarExcel(buildQ())} color={T.green}>📊 Excel</Btn>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{ display: 'none' }} onChange={importar} />
          <Btn onClick={() => fileRef.current?.click()} disabled={importing} color={T.cyan}>{importing ? '⏳' : '📥'} Importar</Btn>
          <Btn onClick={() => API.vehiculos.templateExcel()} color={T.muted}>📋 Plantilla</Btn>
          <PrimaryBtn onClick={() => setModal('add')}>+ Registrar</PrimaryBtn>
        </>}
      </div>

      {view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
          {loading ? Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, height: 160, animation: 'pulse 1.8s infinite' }} />) :
            (data.results || []).map(v => (
              <div key={v.id} style={{ background: T.card, border: `1px solid ${v.en_lista_negra ? T.red + '44' : T.border}`, borderRadius: 12, padding: 16, opacity: v.activo ? 1 : .55, transition: 'all .2s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor = T.borderHov; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={e => { e.currentTarget.style.borderColor = v.en_lista_negra ? T.red + '44' : T.border; e.currentTarget.style.transform = ''; }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontFamily: F.mono, fontSize: 16, fontWeight: 700, color: v.en_lista_negra ? T.red : T.blue, letterSpacing: 3 }}>{v.placa}</div>
                  <Badge color={v.activo ? T.green : T.red}>{v.activo ? '●' : '○'}</Badge>
                </div>
                <div style={{ fontSize: 13, color: T.head, fontWeight: 600, marginBottom: 3 }}>{v.propietario}</div>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>{v.tipo} {v.marca} {v.color}</div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: v.dias_vigencia < 30 ? T.orange : T.muted, marginBottom: 10 }}>⏱ {v.dias_vigencia}d {v.dias_vigencia < 30 && '⚠️'}</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Btn sm onClick={() => verQR(v.id)}>📱 QR</Btn>
                  {isAdmin && <>
                    <Btn sm onClick={() => toggle(v.id, v.placa)} color={v.activo ? T.red : T.green}>{v.activo ? '↓' : '↑'}</Btn>
                    <Btn sm onClick={() => renovar(v.id, v.placa)} color={T.cyan}>🔄</Btn>
                    {v.correo && <Btn sm onClick={() => reenviar(v.id)} color={T.purple}>📧</Btn>}
                  </>}
                </div>
              </div>
            ))
          }
        </div>
      ) : (
        <Table
          heads={[
            { c: 'Placa', w: 100, sortable: true, onSort: () => { toggleSort('placa'); resetPage(); }, sortIndicator: indicator('placa') },
            { c: 'Propietario', sortable: true, onSort: () => { toggleSort('propietario'); resetPage(); }, sortIndicator: indicator('propietario') },
            { c: 'Tipo' }, { c: 'Marca / Modelo' }, { c: 'Estado', w: 100 },
            { c: 'Vigencia', w: 85, sortable: true, onSort: () => { toggleSort('expira_en'); resetPage(); }, sortIndicator: indicator('expira_en') },
            { c: 'Acciones', w: 220 },
          ]}
          rows={rows} loading={loading}
          empty={<Empty icon="🚗" msg="No se encontraron vehículos" />}
          pagination={{ page, total_pages: data.total_pages, count: data.count }}
          onPage={setPage}
        />
      )}

      {modal === 'add' && (
        <Modal onClose={() => setModal(null)} title="🚗 Registrar Nuevo Vehículo" width={620}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 13 }}>
            <div>
              <Lbl c="Placa *" />
              <input value={form.placa} maxLength={6} style={{ fontFamily: F.mono, letterSpacing: 5, fontSize: 20, textAlign: 'center' }}
                onChange={e => { const v = e.target.value.toUpperCase(); setForm(p => ({ ...p, placa: v })); setPInfo(v.length >= 5 ? validatePlate(v) : null); }} placeholder="ABC123" />
              {pInfo && <div style={{ fontSize: 11, marginTop: 4, color: pInfo.valid ? T.green : T.orange }}>{pInfo.valid ? `✓ ${pInfo.kind}` : '⚠ Inválido'}</div>}
            </div>
            <div><Lbl c="Tipo" /><select value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value }))}>{TIPOS.map(o => <option key={o}>{o}</option>)}</select></div>
            <div><Lbl c="Marca" /><input value={form.marca} onChange={e => setForm(p => ({ ...p, marca: e.target.value }))} placeholder="Toyota..." /></div>
            <div><Lbl c="Modelo" /><input value={form.modelo} onChange={e => setForm(p => ({ ...p, modelo: e.target.value }))} placeholder="Corolla..." /></div>
            <div><Lbl c="Color" /><input value={form.color} onChange={e => setForm(p => ({ ...p, color: e.target.value }))} placeholder="Blanco..." /></div>
            <div><Lbl c="Documento" /><input value={form.documento} onChange={e => setForm(p => ({ ...p, documento: e.target.value }))} placeholder="12345678" /></div>
            <div style={{ gridColumn: 'span 2' }}><Lbl c="Propietario *" /><input value={form.propietario} onChange={e => setForm(p => ({ ...p, propietario: e.target.value }))} placeholder="Nombre completo" /></div>
            <div><Lbl c="Correo (QR automático)" /><input type="email" value={form.correo} onChange={e => setForm(p => ({ ...p, correo: e.target.value }))} placeholder="correo@ucundinamarca.edu.co" /></div>
            <div><Lbl c="Teléfono" /><input value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} placeholder="3101234567" /></div>
            <div style={{ gridColumn: 'span 2' }}><Lbl c="Notas" /><textarea value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} style={{ minHeight: 55 }} /></div>
          </div>
          <div style={{ marginTop: 10, padding: '9px 13px', background: 'rgba(0,180,255,.05)', border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 11, color: T.muted }}>
            🔐 QR SHA-256 · Vigencia 365 días · Email enviado via Celery con reintentos automáticos
          </div>
          <div style={{ display: 'flex', gap: 9, marginTop: 16 }}>
            <PrimaryBtn onClick={submit} loading={saving} full>📲 Registrar y Generar QR</PrimaryBtn>
            <Btn onClick={() => setModal(null)} color={T.muted}>Cancelar</Btn>
          </div>
        </Modal>
      )}

      {modal?.type === 'qr' && (
        <Modal onClose={() => setModal(null)} title={`📱 QR — ${modal.qr.placa}`}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 14, display: 'inline-block', boxShadow: `0 0 40px ${T.blue}30`, marginBottom: 14 }}>
              <img src={modal.qr.qr_imagen_url} alt="QR" width={210} height={210} style={{ display: 'block' }} />
            </div>
            <div style={{ fontSize: 14, color: T.head, fontWeight: 600, marginBottom: 3 }}>{modal.qr.propietario}</div>
            <div style={{ fontSize: 11, color: T.muted, marginBottom: 12 }}>{modal.qr.tipo} {modal.qr.marca} · {modal.qr.color}</div>
            <div style={{ padding: '9px 13px', background: T.card2, border: `1px solid ${T.border}`, borderRadius: 8, fontFamily: F.mono, fontSize: 8.5, color: T.muted, wordBreak: 'break-all', textAlign: 'left', marginBottom: 12 }}>{modal.qr.codigo_qr}</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <div style={{ flex: 1, padding: 9, background: modal.qr.activo ? 'rgba(0,255,163,.07)' : 'rgba(255,61,61,.07)', border: `1px solid ${modal.qr.activo ? T.green : T.red}30`, borderRadius: 8, fontSize: 11, color: modal.qr.activo ? T.green : T.red, fontFamily: F.mono }}>{modal.qr.activo ? '● ACTIVO' : '○ INACTIVO'}</div>
              <div style={{ flex: 1, padding: 9, background: modal.qr.dias_vigencia < 30 ? 'rgba(255,140,0,.07)' : 'rgba(0,180,255,.07)', border: `1px solid ${modal.qr.dias_vigencia < 30 ? T.orange : T.blue}30`, borderRadius: 8, fontSize: 11, color: modal.qr.dias_vigencia < 30 ? T.orange : T.blue, fontFamily: F.mono }}>⏱ {modal.qr.dias_vigencia} días</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <PrimaryBtn onClick={() => printQR(modal.qr)} full color={T.cyan}>🖨️ Imprimir QR</PrimaryBtn>
              <Btn onClick={() => setModal(null)} color={T.muted}>Cerrar</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}