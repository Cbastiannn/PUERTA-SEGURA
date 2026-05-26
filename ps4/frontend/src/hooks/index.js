// src/hooks/index.js — Custom hooks reutilizables

import { useState, useEffect, useCallback, useRef } from "react";

// ── Debounce: retrasa una búsqueda hasta que el usuario deja de escribir ─────
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── Paginación ────────────────────────────────────────────────────────────────
export function usePagination(initial = 1) {
  const [page, setPage] = useState(initial);
  const reset = useCallback(() => setPage(1), []);
  return [page, setPage, reset];
}

// ── Ordenamiento de tabla ─────────────────────────────────────────────────────
export function useSort(initial = '') {
  const [sortBy, setSortBy] = useState(initial);

  const toggle = useCallback((field) => {
    setSortBy(prev => {
      if (prev === field) return `-${field}`;
      if (prev === `-${field}`) return '';
      return field;
    });
  }, []);

  const indicator = useCallback((field) => {
    if (sortBy === field)  return ' ↑';
    if (sortBy === `-${field}`) return ' ↓';
    return ' ⇅';
  }, [sortBy]);

  return { sortBy, toggle, indicator };
}

// ── Toast notifications ────────────────────────────────────────────────────────
export function useToast() {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((msg, type = 'info', ms = 4500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev.slice(-4), { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), ms);
  }, []);

  return { toasts, toast };
}

// ── Contador animado (ease-out) ───────────────────────────────────────────────
export function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const from = prevTarget.current;
    prevTarget.current = target;
    let start = null;

    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setVal(Math.round(from + (target - from) * eased));
      if (progress < 1) requestAnimationFrame(step);
    };

    requestAnimationFrame(step);
  }, [target, duration]);

  return val;
}

// ── Fetch con loading/error/data ──────────────────────────────────────────────
export function useFetch(fetchFn, deps = []) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (e) {
      setError(e?.error || 'Error de conexión');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, reload: load };
}

// ── Click fuera de un elemento ────────────────────────────────────────────────
export function useClickOutside(ref, handler) {
  useEffect(() => {
    const fn = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handler();
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [ref, handler]);
}

// ── Tecla ─────────────────────────────────────────────────────────────────────
export function useKey(key, handler, ctrl = false) {
  useEffect(() => {
    const fn = (e) => {
      if (ctrl && !e.ctrlKey && !e.metaKey) return;
      if (e.key === key) { e.preventDefault(); handler(); }
    };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [key, handler, ctrl]);
}
