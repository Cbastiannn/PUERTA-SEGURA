// src/context/AppContext.jsx — Estado global con React Context
// FIX #1: WebSocket URL corregida para dev/prod
import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import * as API from "../api";

const AppContext = createContext(null);
export const useApp = () => useContext(AppContext);

export function AppProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [notifCount, setNC]   = useState(0);
  const [barrierData, setBD]  = useState({ abierta: false });
  const [wsStats, setWsStats] = useState(null);
  const [wsConnected, setWSC] = useState(false);
  const wsRef = useRef(null);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const d = await API.notificaciones.list();
      const arr = Array.isArray(d) ? d : d.results || [];
      setNC(arr.filter(n => !n.leida).length);
    } catch {}
  }, [user]);

  // FIX #1 — WebSocket URL: en dev backend está en :8000, en prod en el mismo host
  useEffect(() => {
    if (!user) return;
    let reconnectTimer = null;

    const getWsUrl = (path) => {
      if (process.env.REACT_APP_WS_URL) return `${process.env.REACT_APP_WS_URL}${path}`;
      const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const host  = window.location.hostname;
      const port  = process.env.NODE_ENV === 'development' ? ':8000' : '';
      return `${proto}://${host}${port}${path}`;
    };

    const connect = () => {
      try {
        const ws = new WebSocket(getWsUrl('/ws/dashboard/'));
        wsRef.current = ws;
        ws.onopen    = () => { setWSC(true); clearTimeout(reconnectTimer); };
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data);
            if (msg.type === 'stats')   { setWsStats(msg.data); }
            if (msg.type === 'barrier') setBD(msg.data);
          } catch {}
        };
        ws.onclose = (e) => {
          setWSC(false); wsRef.current = null;
          if (e.code !== 1000) reconnectTimer = setTimeout(connect, 5000);
        };
        ws.onerror = () => ws.close();
        const ping = setInterval(() => { if (ws.readyState === 1) ws.send('{}'); }, 25000);
        ws._ping = ping;
      } catch { setWSC(false); }
    };

    connect();
    refreshNotifications();
    const poll = setInterval(refreshNotifications, 30000);

    return () => {
      clearTimeout(reconnectTimer); clearInterval(poll);
      if (wsRef.current) {
        clearInterval(wsRef.current._ping);
        wsRef.current.onclose = null;
        wsRef.current.close(1000, 'unmount');
        wsRef.current = null;
      }
    };
  }, [user, refreshNotifications]);

  const refreshBarrier = useCallback(async () => {
    try { setBD(await API.barrera.get()); } catch {}
  }, []);

  useEffect(() => {
    if (!user) return;
    refreshBarrier();
    const t = setInterval(() => { if (!wsConnected) refreshBarrier(); }, 5000);
    return () => clearInterval(t);
  }, [user, wsConnected, refreshBarrier]);

  const login = useCallback((userData, token, refresh) => {
    API.setToken(token); API.setRefresh(refresh); API.setUser(userData); setUser(userData);
  }, []);

  const logout = useCallback(async () => {
    try { const r = API.getRefresh(); if (r) await API.auth.logout(r); } catch {}
    API.clearAuth(); setUser(null); setNC(0); setWsStats(null); setWSC(false);
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close(1000,'logout'); wsRef.current = null; }
  }, []);

  return (
    <AppContext.Provider value={{ user, login, logout, notifCount, setNC, refreshNotifications, barrierData, setBD, refreshBarrier, wsStats, wsConnected, isAdmin: user?.role === 'admin' }}>
      {children}
    </AppContext.Provider>
  );
}
