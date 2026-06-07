import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Topbar({ onMenuClick }) {
  const { auth } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const goHome = () => {
    const role = auth?.user?.role
    if (role === 'MANAGER') navigate('/manager')
    else if (role === 'TEAM_MEMBER') navigate('/member')
    else navigate('/')
  }

  const ROOT_PATHS = ['/manager', '/member', '/login', '/unauthorized', '/set-password']
  const isRootPage = ROOT_PATHS.some(p => location.pathname === p)
  const showBack = !isRootPage

  return (
    <header className="topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {showBack && (
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: 32, height: 32, borderRadius: '8px', color: 'var(--text-2)',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
            aria-label="Go back"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}
        <div className="topbar-brand" onClick={goHome} style={{ cursor: 'pointer' }}>
          <div className="topbar-brand-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {/* Clipboard body */}
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
              {/* Clipboard top clip */}
              <rect x="9" y="3" width="6" height="4" rx="1" />
              {/* Checkmark lines */}
              <path d="M9 12l2 2 4-4" strokeWidth="2.2" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span className="topbar-brand-text">Work Planner</span>
            <span style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '1px' }}>Task Manager</span>
          </div>
        </div>
      </div>
      <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>
    </header>
  )
}
