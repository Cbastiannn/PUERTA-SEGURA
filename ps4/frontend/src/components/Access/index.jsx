import { useState, useEffect, useRef, useCallback } from "react";
import { T, F, validatePlate, fmtTime, fmtDateLong } from "../../utils";
import { Card, Btn, PrimaryBtn, Badge, Spinner } from "../UI";
import { useApp } from "../../context/AppContext";
import * as API from "../../api";

// FIX #2: playBeep definido fuera del componente (no necesita re-crearse)
function playBeep(success) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    if (success) {
      osc.frequency.value = 880; osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start(); osc.stop(ctx.currentTime + 0.35);
    } else {
      osc.frequency.value = 220; osc.type = 'sawtooth';
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);
      osc.start(); osc.stop(ctx.currentTime + 0.55);
    }
  } catch { /* AudioContext no disponible */ }
}

export default function AccessCtrl({ toast }) {
  const { user, barrierData, setBD } = useApp();
  const [tab, setTab]         = useState('qr');
  const [scanResult, setSR]   = useState(null);
  const [manResult,  setMR]   = useState(null);
  const [outResult,  setOR]   = useState(null);
  const [scanning,   setScan] = useState(false);
  const [camActive,  setCam]  = useState(false);
  const [manPlate,   setMP]   = useState('');
  const [outPlate,   setOP]   = useState('');
  const [time, setTime]       = useState(new Date());

  const videoRef   = useRef(null);
  const canvasRef  = useRef(null);
  const streamRef  = useRef(null);
  const rafRef     = useRef(null);
  // FIX #2: usar ref para el callback de processQR para evitar stale closures en loop
  const processRef = useRef(null);

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);

  // FIX #2: stopCam definido primero, antes de loop y startCam
  const stopCam = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCam(false);
  }, []);

  // FIX #2: processQR definido antes de loop, referenciado via processRef
  const processQR = useCallback(async (qrCode) => {
    setScan(true); setSR(null);
    try {
      const r = await API.acceso.qr(qrCode);
      setSR(r);
      if (r.autorizado) {
        playBeep(true);
        toast(`✅ Autorizado — ${r.propietario}`, 'success');
        setBD(p => ({ ...p, abierta: true }));
        setTimeout(() => setBD(p => ({ ...p, abierta: false })), 5000);
      } else {
        playBeep(false);
        toast(r.motivo, 'error');
      }
    } catch (e) {
      toast(e.error || 'Error procesando QR', 'error');
    } finally {
      setScan(false);
    }
  }, [toast, setBD]);

  // Mantener processRef actualizado
  useEffect(() => { processRef.current = processQR; }, [processQR]);

  // FIX #2: loop usa processRef.current y stopCam — no stale closures
  const loop = useCallback(() => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || !window.jsQR || v.readyState < 2) {
      rafRef.current = requestAnimationFrame(loop);
      return;
    }
    c.width = v.videoWidth; c.height = v.videoHeight;
    const ctx = c.getContext('2d'); ctx.drawImage(v, 0, 0);
    const code = window.jsQR(ctx.getImageData(0, 0, c.width, c.height).data, c.width, c.height);
    if (code?.data?.startsWith('PSU-v2-')) {
      stopCam();
      processRef.current?.(code.data);
      return;
    }
    rafRef.current = requestAnimationFrame(loop);
  }, [stopCam]);

  useEffect(() => () => stopCam(), [stopCam]);

  const startCam = useCallback(async () => {
    // Cargar jsQR si no está disponible
      if (!window.jsQR) { 
        const jsQR = await import('jsqr');
        window.jsQR = jsQR.default;
      }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCam(true);
      rafRef.current = requestAnimationFrame(loop);
    } catch (e) {
      toast(e.name === 'NotAllowedError' ? 'Permiso de cámara denegado' : 'Sin cámara disponible', 'error');
    }
  }, [loop, toast]);

  const toggleBarrier = useCallback(async () => {
    try {
      const d = await API.barrera.set(!barrierData.abierta);
      setBD(d);
      toast(d.abierta ? '🔓 Barrera abierta' : '🔒 Barrera cerrada', d.abierta ? 'success' : 'info');
    } catch { toast('Error al controlar barrera', 'error'); }
  }, [barrierData.abierta, setBD, toast]);

  const doManual = useCallback(async () => {
    if (!manPlate.trim()) { toast('Ingresa una placa', 'error'); return; }
    try {
      const r = await API.acceso.placa(manPlate.trim());
      setMR(r);
      r.autorizado ? toast(`✅ Autorizado — ${r.propietario}`, 'success') : toast(r.motivo, 'error');
      playBeep(r.autorizado);
    } catch (e) { toast(e.error || 'Error', 'error'); }
  }, [manPlate, toast]);

  const doSalida = useCallback(async () => {
    if (!outPlate.trim()) { toast('Ingresa una placa', 'error'); return; }
    try {
      const r = await API.acceso.salida(outPlate.trim());
      setOR(r);
      toast(`↙️ Salida registrada — ${outPlate}`, 'success');
    } catch (e) { toast(e.error || 'Error', 'error'); }
  }, [outPlate, toast]);

  const activeR  = tab === 'qr' ? scanResult : tab === 'manual' ? manResult : outResult;
  const barrier  = barrierData.abierta;
  const TABS     = [{ id:'qr',l:'📷 Escaneo QR' },{ id:'manual',l:'⌨️ Manual' },{ id:'salida',l:'↙️ Salida' }];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 18 }}>
      <div>
        {/* Tabs */}
        <div style={{ display: 'flex', background: T.card, border: `1px solid ${T.border}`, borderRadius: 10, padding: 3, marginBottom: 18, width: 'fit-content' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => { setTab(t.id); setSR(null); setMR(null); setOR(null); if (camActive) stopCam(); }}
              style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', background: tab === t.id ? T.blue : 'transparent', color: tab === t.id ? '#000' : T.muted, fontFamily: F.head, fontSize: 13, fontWeight: 700, transition: 'all .2s' }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* QR */}
        {tab === 'qr' && (
          <div>
            <div style={{ position:'relative', width:'100%', maxWidth:360, aspectRatio:'1', background:'#000', borderRadius:14, overflow:'hidden', margin:'0 auto 16px', border:`2px solid ${camActive?T.blue:scanResult?.autorizado===true?T.green:scanResult?.autorizado===false?T.red:T.border}`, boxShadow:camActive?`0 0 28px ${T.blue}30`:'none', transition:'all .4s' }}>
              <video ref={videoRef} playsInline muted style={{ width:'100%', height:'100%', objectFit:'cover', display:camActive?'block':'none' }} />
              <canvas ref={canvasRef} style={{ display:'none' }} />
              <div style={{ position:'absolute', inset:0, backgroundImage:`linear-gradient(rgba(0,180,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,180,255,.04) 1px,transparent 1px)`, backgroundSize:'28px 28px', display:camActive?'none':'block' }} />
              {/* Esquinas QR */}
              {[[0,0],[0,1],[1,0],[1,1]].map(([r,c],i) => (
                <div key={i} style={{ position:'absolute', width:26, height:26, top:r?'auto':14, bottom:r?14:'auto', left:c?'auto':14, right:c?14:'auto', borderTop:r?'none':`3px solid ${T.blue}`, borderBottom:r?`3px solid ${T.blue}`:'none', borderLeft:c?'none':`3px solid ${T.blue}`, borderRight:c?`3px solid ${T.blue}`:'none', pointerEvents:'none' }} />
              ))}
              {camActive && <div style={{ position:'absolute', left:18, right:18, height:2, background:`linear-gradient(90deg,transparent,${T.blue},transparent)`, boxShadow:`0 0 8px ${T.blue}`, animation:'scanL 2s linear infinite' }} />}
              <div style={{ position:'absolute', inset:0, display:camActive?'none':'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:10 }}>
                {scanning
                  ? <><Spinner size={40}/><div style={{ fontSize:10, color:T.blue, fontFamily:F.mono, animation:'blink 1s infinite' }}>PROCESANDO QR...</div></>
                  : scanResult
                    ? <><div style={{ fontSize:58 }}>{scanResult.autorizado?'✅':'❌'}</div><div style={{ fontFamily:F.head, fontSize:20, fontWeight:700, color:scanResult.autorizado?T.green:T.red }}>{scanResult.estado?.toUpperCase()}</div></>
                    : <><div style={{ fontSize:40, opacity:.15 }}>📷</div><div style={{ fontSize:10, color:T.muted, fontFamily:F.mono, letterSpacing:2 }}>CÁMARA LISTA</div></>
                }
              </div>
            </div>
            <div style={{ display:'flex', gap:9, marginBottom:16 }}>
              {!camActive
                ? <PrimaryBtn onClick={startCam} full>📷 Activar Cámara Real</PrimaryBtn>
                : <Btn onClick={stopCam} color={T.red} full>■ Detener Cámara</Btn>
              }
            </div>
            {scanResult && (
              <div className="fadeUp" style={{ padding:'14px 18px', background:`${scanResult.autorizado?T.green:T.red}0d`, border:`1px solid ${scanResult.autorizado?T.green:T.red}35`, borderRadius:11 }}>
                <div style={{ fontFamily:F.head, fontSize:17, fontWeight:700, color:scanResult.autorizado?T.green:T.red, marginBottom:7 }}>{scanResult.motivo||(scanResult.autorizado?'✅ Acceso Autorizado':'❌ Acceso Denegado')}</div>
                {scanResult.vehiculo && <><div style={{ fontSize:13, color:T.text }}>👤 {scanResult.vehiculo.propietario}</div><div style={{ fontSize:13, color:T.text }}>🚗 {scanResult.vehiculo.tipo} {scanResult.vehiculo.marca}</div></>}
                {scanResult.autorizado && <div style={{ fontSize:11, color:T.green, marginTop:8, fontFamily:F.mono }}>🔔 Beep · 🔓 Barrera abre 5 s</div>}
              </div>
            )}
          </div>
        )}

        {/* Manual */}
        {tab === 'manual' && (
          <div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, color:T.muted, letterSpacing:2.5, fontFamily:F.mono, marginBottom:6, textTransform:'uppercase' }}>Placa del vehículo</div>
              <input value={manPlate} maxLength={6} style={{ fontSize:28, letterSpacing:7, fontFamily:F.mono, textAlign:'center' }}
                onChange={e => { setMP(e.target.value.toUpperCase()); setMR(null); }} onKeyDown={e => e.key==='Enter'&&doManual()} placeholder="ABC123" />
              {manPlate.length>=5 && (() => { const pv=validatePlate(manPlate); return <div style={{ fontSize:11, marginTop:4, color:pv.valid?T.green:T.orange }}>{pv.valid?`✓ ${pv.kind}`:'⚠ Inválido'}</div>; })()}
            </div>
            <PrimaryBtn onClick={doManual} full color={T.green}>🔍 VERIFICAR ACCESO</PrimaryBtn>
            {manResult && <div className="fadeUp" style={{ marginTop:13, padding:'14px 18px', background:`${manResult.autorizado?T.green:T.red}0d`, border:`1px solid ${manResult.autorizado?T.green:T.red}35`, borderRadius:11 }}>
              <div style={{ fontFamily:F.head, fontSize:17, fontWeight:700, color:manResult.autorizado?T.green:T.red, marginBottom:7 }}>{manResult.motivo||(manResult.autorizado?'✅ Autorizado':'❌ Denegado')}</div>
              {manResult.vehiculo && <div style={{ fontSize:13, color:T.text }}>{manResult.vehiculo.propietario} — {manResult.vehiculo.tipo}</div>}
            </div>}
          </div>
        )}

        {/* Salida */}
        {tab === 'salida' && (
          <div>
            <div style={{ marginBottom:14, padding:'11px 14px', background:'rgba(0,255,163,.04)', border:`1px solid ${T.green}20`, borderRadius:8, fontSize:12, color:T.muted }}>
              ↙️ Registra la <strong style={{ color:T.green }}>salida de un vehículo</strong> del campus. Actualiza el historial y el contador en tiempo real.
            </div>
            <div style={{ marginBottom:14 }}>
              <div style={{ fontSize:10, color:T.muted, letterSpacing:2.5, fontFamily:F.mono, marginBottom:6, textTransform:'uppercase' }}>Placa del vehículo</div>
              <input value={outPlate} maxLength={6} style={{ fontSize:28, letterSpacing:7, fontFamily:F.mono, textAlign:'center' }}
                onChange={e => { setOP(e.target.value.toUpperCase()); setOR(null); }} onKeyDown={e => e.key==='Enter'&&doSalida()} placeholder="ABC123" />
            </div>
            <PrimaryBtn onClick={doSalida} full color={T.cyan}>↙️ REGISTRAR SALIDA</PrimaryBtn>
            {outResult && <div className="fadeUp" style={{ marginTop:13, padding:'13px 16px', background:'rgba(0,212,200,.07)', border:`1px solid ${T.cyan}30`, borderRadius:10 }}>
              <div style={{ color:T.cyan, fontFamily:F.head, fontSize:16, fontWeight:700 }}>✅ {outResult.message}</div>
            </div>}
          </div>
        )}
      </div>

      {/* Panel derecho */}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <Card style={{ padding:18, textAlign:'center' }}>
          <div style={{ fontFamily:F.mono, fontSize:9, color:T.muted, letterSpacing:2.5, marginBottom:14 }}>CONTROL DE BARRERA</div>
          <div style={{ position:'relative', height:78, marginBottom:14, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{ width:13, height:56, background:'#152030', borderRadius:4 }} />
            <div style={{ position:'absolute', left:'calc(50% + 2px)', top:'50%', width:110, height:11, borderRadius:5, background:barrier?`linear-gradient(90deg,${T.green},${T.cyan})`:`linear-gradient(90deg,${T.red},#ff8888)`, transformOrigin:'0 50%', transform:`translate(0,-50%) rotate(${barrier?-85:0}deg)`, transition:'transform .9s cubic-bezier(.34,1.6,.64,1),background .4s', boxShadow:`0 0 14px ${barrier?T.green:T.red}60`, animation:'glow 2.5s ease-in-out infinite' }} />
          </div>
          <div style={{ fontFamily:F.head, fontSize:18, fontWeight:700, color:barrier?T.green:T.red, marginBottom:12, letterSpacing:1 }}>{barrier?'🔓 ABIERTA':'🔒 CERRADA'}</div>
          <button onClick={toggleBarrier} style={{ width:'100%', padding:'12px', background:barrier?'rgba(255,61,61,.1)':'rgba(0,255,163,.1)', border:`2px solid ${barrier?T.red:T.green}`, borderRadius:10, color:barrier?T.red:T.green, fontFamily:F.head, fontWeight:700, fontSize:15, cursor:'pointer', transition:'all .22s' }}
            onMouseOver={e=>e.currentTarget.style.background=barrier?'rgba(255,61,61,.18)':'rgba(0,255,163,.18)'}
            onMouseOut={e=>e.currentTarget.style.background=barrier?'rgba(255,61,61,.1)':'rgba(0,255,163,.1)'}>
            {barrier?'🔒 CERRAR':'🔓 ABRIR'}
          </button>
        </Card>

        <Card style={{ padding:16, textAlign:'center' }}>
          <div style={{ fontFamily:F.mono, fontSize:9, color:T.muted, letterSpacing:2.5, marginBottom:14 }}>SEMÁFORO</div>
          <div style={{ display:'flex', justifyContent:'center', gap:18, marginBottom:10 }}>
            {[{c:T.red,on:activeR?.autorizado===false},{c:T.orange,on:false},{c:T.green,on:activeR?.autorizado===true}].map((s,i)=>(
              <div key={i} style={{ width:34, height:34, borderRadius:'50%', background:s.on?s.c:'#0d1a24', border:`3px solid ${s.on?s.c:'#1a2f40'}`, boxShadow:s.on?`0 0 14px ${s.c},0 0 28px ${s.c}55`:'none', transition:'all .4s' }} />
            ))}
          </div>
          <div style={{ fontFamily:F.mono, fontSize:10, color:activeR?(activeR.autorizado?T.green:T.red):T.muted }}>
            {activeR?(activeR.autorizado?'● AUTORIZADO':'● DENEGADO'):'○ EN ESPERA'}
          </div>
        </Card>

        <Card style={{ padding:16 }}>
          <div style={{ fontFamily:F.mono, fontSize:9, color:T.muted, letterSpacing:2.5, marginBottom:12 }}>TURNO ACTIVO</div>
          <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:11 }}>
            <div style={{ width:40, height:40, borderRadius:10, background:user?.role==='admin'?'rgba(255,215,0,.12)':'rgba(0,180,255,.12)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:F.head, fontWeight:700, fontSize:15, color:user?.role==='admin'?T.yellow:T.blue, border:`1px solid ${user?.role==='admin'?T.yellow:T.blue}30`, flexShrink:0 }}>
              {user?.avatar_initials||user?.first_name?.[0]||'?'}
            </div>
            <div>
              <div style={{ fontSize:12, color:T.head, fontWeight:600 }}>{user?.first_name} {user?.last_name}</div>
              <div style={{ fontSize:10, color:T.muted }}>{user?.role==='admin'?'🔑 Admin':'👁️ Vigilante'}</div>
            </div>
          </div>
          <div style={{ fontSize:11, color:T.muted, marginBottom:9 }}>📍 {user?.access_point}</div>
          <div style={{ fontFamily:F.mono, fontSize:20, color:T.blue, letterSpacing:.5 }}>{fmtTime(time)}</div>
          <div style={{ fontFamily:F.mono, fontSize:9.5, color:T.muted, marginTop:4, lineHeight:1.5 }}>{fmtDateLong(time)}</div>
        </Card>
      </div>
    </div>
  );
}
