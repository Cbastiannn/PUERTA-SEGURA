// ═══════════════════════════════════════════════════════════════
// Puerta Segura v3.0 — API Service Layer
// ═══════════════════════════════════════════════════════════════
const BASE = process.env.REACT_APP_API_URL || '';
const API  = `${BASE}/api`;

let _token   = null;
let _refresh = null;  // único — FIX #8
let _user    = null;
let _onUnauth = null;

export const setToken   = (t) => { _token = t; };
export const setRefresh = (r) => { _refresh = r; };
export const setUser    = (u) => { _user = u; };
export const getUser    = ()  => _user;
export const getRefresh = ()  => _refresh;          // FIX #8 — solo una vez
export const clearAuth  = ()  => { _token = null; _refresh = null; _user = null; };
export const onUnauthorized = (fn) => { _onUnauth = fn; };

async function req(endpoint, opts = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  const url = endpoint.startsWith('http') ? endpoint : `${API}${endpoint}`;
  const res = await fetch(url, { ...opts, headers: { ...headers, ...opts.headers } });
  if (res.status === 401 && _onUnauth) { _onUnauth(); return; }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Error de conexión con el servidor' }));
    throw { status: res.status, ...err };
  }
  return res.status === 204 ? null : res.json();
}

async function download(endpoint, filename) {
  const headers = {};
  if (_token) headers['Authorization'] = `Bearer ${_token}`;
  const res = await fetch(`${API}${endpoint}`, { headers });
  if (!res.ok) throw new Error('Error al descargar archivo');
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export const auth = {
  registro: (d) => req('/auth/registro/', { method: 'POST', body: JSON.stringify(d) }),
  login:    (email, password) => req('/auth/login/', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: (refresh)         => req('/auth/logout/', { method: 'POST', body: JSON.stringify({ refresh }) }),
  me:     ()                => req('/auth/me/'),
};

export const users = {
  list:          (p = '') => req(`/users/${p ? '?' + p : ''}`),
  create:        (d)      => req('/users/', { method: 'POST', body: JSON.stringify(d) }),
  update:        (id, d)  => req(`/users/${id}/`, { method: 'PATCH', body: JSON.stringify(d) }),
  toggleActive:  (id)     => req(`/users/${id}/toggle_active/`, { method: 'PATCH' }),
  resetPassword: (id, pw) => req(`/users/${id}/reset_password/`, { method: 'POST', body: JSON.stringify({ password: pw }) }),
};

export const vehiculos = {
  list:          (p = '') => req(`/vehiculos/${p ? '?' + p : ''}`),
  create:        (d)      => req('/vehiculos/', { method: 'POST', body: JSON.stringify(d) }),
  toggle:        (id)     => req(`/vehiculos/${id}/toggle/`, { method: 'PATCH' }),
  qr:            (id)     => req(`/vehiculos/${id}/qr/`),
  renovarQR:     (id)     => req(`/vehiculos/${id}/renovar_qr/`, { method: 'POST' }),
  reenviarQR:    (id)     => req(`/vehiculos/${id}/reenviar_qr/`, { method: 'POST' }),
  importarExcel: (file)   => {
    const fd = new FormData(); fd.append('file', file);
    const headers = {}; if (_token) headers['Authorization'] = `Bearer ${_token}`;
    return fetch(`${API}/vehiculos/importar_excel/`, { method: 'POST', headers, body: fd }).then(r => r.json());
  },
  templateExcel: () => download('/vehiculos/template_excel/', 'plantilla-vehiculos.xlsx'),
  exportarExcel: (p = '') => download(`/vehiculos/exportar_excel/${p ? '?' + p : ''}`, 'vehiculos.xlsx'),
};

export const acceso = {
  qr:     (qr_code) => req('/acceso/qr/',    { method: 'POST', body: JSON.stringify({ qr_code }) }),
  placa:  (placa)   => req('/acceso/placa/', { method: 'POST', body: JSON.stringify({ placa }) }),
  salida: (placa, metodo = 'Manual') => req('/acceso/salida/', { method: 'POST', body: JSON.stringify({ placa, metodo }) }),
};

export const barrera = {
  get: ()                    => req('/barrera/'),
  set: (abierta, razon = '') => req('/barrera/', { method: 'POST', body: JSON.stringify({ abierta, razon }) }),
};

export const historial = {
  list:         (p = '') => req(`/historial/${p ? '?' + p : ''}`),
  exportarExcel:(p = '') => download(`/historial/exportar_excel/${p ? '?' + p : ''}`, 'historial.xlsx'),
  exportarCSV:  (p = '') => download(`/historial/exportar_csv/${p ? '?' + p : ''}`, 'historial.csv'),
};

export const listaNegra = {
  list:   ()    => req('/lista-negra/'),
  add:    (d)   => req('/lista-negra/', { method: 'POST', body: JSON.stringify(d) }),
  remove: (id)  => req(`/lista-negra/${id}/`, { method: 'DELETE' }),
};

export const visitantes = {
  list:   (p = '') => req(`/visitantes/${p ? '?' + p : ''}`),
  create: (d)      => req('/visitantes/', { method: 'POST', body: JSON.stringify(d) }),
  salida: (id, obs = '') => req(`/visitantes/${id}/salida/`, { method: 'PATCH', body: JSON.stringify({ observaciones: obs }) }),
};

export const notificaciones = {
  list:        () => req('/notificaciones/'),
  leer:        (id) => req(`/notificaciones/${id}/leer/`, { method: 'PATCH' }),
  marcarTodas: () => req('/notificaciones/marcar_todas_leidas/', { method: 'POST' }),
};

export const auditoria = {
  list:          (p = '') => req(`/auditoria/${p ? '?' + p : ''}`),
  exportarExcel: ()       => download('/exportar/auditoria-excel/', 'auditoria.xlsx'),
};

export const stats   = { get: () => req('/stats/'), heatmap: () => req('/stats/heatmap/') };
export const reporte = { get: (desde, hasta) => req(`/reporte/?desde=${desde}&hasta=${hasta}`) };


