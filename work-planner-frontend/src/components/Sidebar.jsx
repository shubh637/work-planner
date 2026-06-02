import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const MANAGER_NAV = [
  {
    to: '/manager', label: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6',
  },
  {
    to: '/manager/projects', label: 'Projects',
    icon: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
  },
  {
    to: '/manager/tasks', label: 'Tasks',
    icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2 M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2 M9 12l2 2 4-4',
  },
  {
    to: '/manager/team', label: 'Team Members',
    icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75',
  },
  {
    to: '/manager/reports', label: 'Reports',
    icon: 'M18 20V10 M12 20V4 M6 20v-6',
  },
]

const MEMBER_NAV = [
  {
    to: '/member', label: 'Dashboard',
    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 0 0 1 1h3m10-11l2 2m-2-2v10a1 1 0 0 1-1 1h-3m-6 0a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1m-6 0h6',
  },
{
    to: '/member/suggestions', label: 'My Suggestions',
    icon: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  },
]

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const AVATAR_COLORS = [
  '#4f46e5', '#0891b2', '#059669', '#d97706', '#db2777', '#7c3aed',
]

function getAvatarColor(name) {
  return AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]
}

function NavIcon({ d }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d={d} />
    </svg>
  )
}

export default function Sidebar({ open, onClose }) {
  const { auth, logout } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()

  const isManager = auth?.user?.role === 'MANAGER'
  const nav       = isManager ? MANAGER_NAV : MEMBER_NAV
  const name      = auth?.user?.name || ''
  const email     = auth?.user?.email || ''
  const role      = isManager ? 'Manager' : 'Team Member'
  const avatarColor = getAvatarColor(name)

  const handleLogout = () => { logout(); navigate('/login'); onClose() }

  const isActive = (to) =>
    to === (isManager ? '/manager' : '/member')
      ? location.pathname === to
      : location.pathname.startsWith(to)

  return (
    <aside style={{
      position: 'fixed', top: 0, right: open ? 0 : '-320px', bottom: 0,
      width: '300px', background: 'var(--surface)',
      display: 'flex', flexDirection: 'column',
      zIndex: 500, transition: 'right 0.28s cubic-bezier(0.4,0,0.2,1)',
      boxShadow: open ? '-4px 0 40px rgba(15,23,42,.14)' : 'none',
      borderLeft: '1px solid var(--border)',
    }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 60%, #4f46e5 100%)',
        padding: '20px 20px 24px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* decorative circles */}
        <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

        {/* Close btn */}
        <button onClick={onClose} aria-label="Close" style={{
          position: 'absolute', top: 14, right: 14,
          width: 30, height: 30, borderRadius: '8px',
          background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)',
          color: 'rgba(255,255,255,0.8)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'background 0.15s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>

        {/* Avatar */}
        <div style={{
          width: 54, height: 54, borderRadius: '50%',
          background: `linear-gradient(135deg, ${avatarColor}cc, ${avatarColor})`,
          color: 'white', fontWeight: 800, fontSize: '1.1rem',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 0 3px rgba(255,255,255,0.25)',
          letterSpacing: '-0.02em', marginBottom: '12px',
        }}>
          {getInitials(name)}
        </div>

        <div style={{ color: '#fff', fontWeight: 700, fontSize: '1rem', letterSpacing: '-0.01em', marginBottom: '4px' }}>{name}</div>
        {email && <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>}
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '5px',
          background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.9)', padding: '3px 10px',
          borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.07em',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isManager ? '#fbbf24' : '#34d399' }} />
          {role}
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>

        <div style={{ fontSize: '0.62rem', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.1em', padding: '8px 10px 6px' }}>
          Menu
        </div>
        {nav.map(({ to, icon, label }) => {
          const active = isActive(to)
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              style={{
                display: 'flex', alignItems: 'center', gap: '11px',
                padding: '10px 12px', borderRadius: '10px', marginBottom: '2px',
                textDecoration: 'none', transition: 'all 0.15s',
                background: active ? 'var(--brand-light)' : 'transparent',
                color: active ? 'var(--brand)' : 'var(--text-2)',
                fontWeight: active ? 700 : 500, fontSize: '0.875rem',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-3)' }}
              onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
            >
              {active && (
                <span style={{
                  position: 'absolute', left: 0, top: '20%', bottom: '20%',
                  width: 3, background: 'var(--brand)', borderRadius: '0 3px 3px 0',
                }} />
              )}
              <NavIcon d={icon} />
              <span style={{ flex: 1 }}>{label}</span>
              {active && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '10px', borderTop: '1px solid var(--border)' }}>
        <Link
          to={isManager ? '/manager/settings' : '/member/settings'}
          onClick={onClose}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '11px',
            padding: '10px 12px', borderRadius: '10px', border: 'none',
            background: 'transparent', color: 'var(--text-2)', fontWeight: 500,
            fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
            textDecoration: 'none', marginBottom: '2px', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
          Settings
        </Link>
        <button
          onClick={handleLogout}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: '11px',
            padding: '10px 12px', borderRadius: '10px', border: 'none',
            background: 'transparent', color: 'var(--red)', fontWeight: 600,
            fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--red-light)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Logout
        </button>
      </div>
    </aside>
  )
}
