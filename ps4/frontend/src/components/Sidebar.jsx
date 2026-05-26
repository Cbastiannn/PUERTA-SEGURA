import { T, F } from "../utils";
import { useApp } from "../context/AppContext";

export default function Sidebar({ nav, view, onNavigate, collapsed, onToggleCollapse, mobileOpen, onMobileClose, onLogout }) {
  const { user, isAdmin } = useApp();
  return (
    <div className="sidebar" style={{
      width: collapsed ? 62 : 218, flexShrink: 0, background: T.card,
      borderRight: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column',
      height: '100%', overflowY: 'auto', overflowX: 'hidden',
      transition: 'width .28s cubic-bezier(.4,0,.2,1)',
      position: 'relative', zIndex: mobileOpen ? 300 : 'auto',
    }}>
      <div style={{ padding: collapsed ? '16px 13px' : '18px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 9, minHeight: 64 }}>
        <div style={{ fontSize: 24, flexShrink: 0, filter: `drop-shadow(0 0 8px rgba(0,180,255,.5))` }}>🛡️</div>
        {!collapsed && <div>
          <div style={{ fontFamily: F.head, fontSize: 15, fontWeight: 700, color: T.head, letterSpacing: 1, lineHeight: 1 }}>
            Puerta <span style={{ color: T.blue }}>Segura</span>
          </div>
          <div style={{ fontFamily: F.mono, fontSize: 7.5, color: T.green, letterSpacing: 3.5, marginTop: 2 }}>v3.0 · UCUNDI</div>
        </div>}
      </div>

      <nav style={{ flex: 1, paddingTop: 6 }}>
        {nav.map(n => (
          <button key={n.id} onClick={() => onNavigate(n.id)} title={collapsed ? n.label : undefined}
            style={{
              display: 'flex', alignItems: 'center', gap: 11, width: '100%',
              padding: collapsed ? '11px 19px' : '10px 16px',
              background: view === n.id ? 'rgba(0,180,255,.1)' : 'transparent',
              border: 'none', borderLeft: view === n.id ? `3px solid ${T.blue}` : '3px solid transparent',
              color: view === n.id ? T.blue : T.muted, fontFamily: F.body, fontSize: 13,
              cursor: 'pointer', textAlign: 'left', transition: 'all .15s', overflow: 'hidden', whiteSpace: 'nowrap'
            }}
            onMouseOver={e => { if (view !== n.id) { e.currentTarget.style.color = T.text; e.currentTarget.style.background = 'rgba(255,255,255,.025)'; } }}
            onMouseOut={e => { if (view !== n.id) { e.currentTarget.style.color = T.muted; e.currentTarget.style.background = 'transparent'; } }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{n.icon}</span>
            {!collapsed && <span style={{ fontWeight: view === n.id ? 600 : 400 }}>{n.label}</span>}
          </button>
        ))}
      </nav>

      <div style={{ padding: collapsed ? '10px 11px' : '12px 15px', borderTop: `1px solid ${T.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
          <div style={{ width: 34, height: 34, borderRadius: 9, background: isAdmin ? 'rgba(255,215,0,.1)' : 'rgba(0,180,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: F.head, fontWeight: 700, fontSize: 12, color: isAdmin ? T.yellow : T.blue, border: `1px solid ${isAdmin ? T.yellow : T.blue}28`, flexShrink: 0 }}>
            {user?.avatar_initials || user?.first_name?.[0] || '?'}
          </div>
          {!collapsed && <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: 12, color: T.text, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.first_name} {user?.last_name}</div>
            <div style={{ fontSize: 9.5, color: T.muted, textTransform: 'uppercase', letterSpacing: .8 }}>{user?.role}</div>
          </div>}
        </div>
        <button onClick={onLogout}
          style={{ width: '100%', padding: collapsed ? '7px 4px' : '7px 9px', background: 'rgba(255,61,61,.06)', border: '1px solid rgba(255,61,61,.18)', borderRadius: 7, color: '#ff8888', fontSize: 11, cursor: 'pointer', fontFamily: F.body, transition: 'all .18s', overflow: 'hidden', whiteSpace: 'nowrap' }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,61,61,.12)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,61,61,.06)'}>
          {collapsed ? '⏻' : '⏻ Cerrar sesión'}
        </button>
      </div>
    </div>
  );
}
