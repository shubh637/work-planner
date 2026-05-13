import React from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { MdDashboard, MdFolderOpen, MdTask, MdGroup, MdBarChart, MdLightbulb, MdAddCircle } from 'react-icons/md'

const MANAGER_NAV = [
  { to: '/manager',          icon: <MdDashboard />,  label: 'Dashboard'   },
  { to: '/manager/projects', icon: <MdFolderOpen />, label: 'Projects'     },
  { to: '/manager/tasks',    icon: <MdTask />,       label: 'Tasks'        },
  { to: '/manager/team',     icon: <MdGroup />,      label: 'Team Members' },
  { to: '/manager/reports',  icon: <MdBarChart />,   label: 'Reports'      },
]

const MEMBER_NAV = [
  { to: '/member',             icon: <MdDashboard />,   label: 'Dashboard'      },
  { to: '/member/tasks',       icon: <MdTask />,        label: 'My Tasks'       },
  { to: '/member/suggestions', icon: <MdLightbulb />,   label: 'My Suggestions' },
  { to: '/member/suggest',     icon: <MdAddCircle />,   label: 'Suggest Task'   },
]
function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

function Avatar({ name, size = 48 }) {
  const colors = [
    ['#4f46e5','#eef2ff'], ['#0891b2','#ecfeff'], ['#059669','#ecfdf5'],
    ['#d97706','#fffbeb'], ['#db2777','#fdf2f8'], ['#7c3aed','#f5f3ff'],
  ]
  const idx = name ? name.charCodeAt(0) % colors.length : 0
  const [bg] = colors[idx]
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, ${bg}, ${bg}cc)`,
      color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 800, fontSize: size * 0.36, flexShrink: 0,
      boxShadow: `0 0 0 3px white, 0 0 0 5px ${bg}66`,
      letterSpacing: '-0.02em',
    }}>
      {getInitials(name)}
    </div>
  )
}

export default function Sidebar({ open, onClose }) {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const isManager = auth?.user?.role === 'MANAGER'
  const nav = isManager ? MANAGER_NAV : MEMBER_NAV
  const name = auth?.user?.name || ''
  const role = isManager ? 'Manager' : 'Team Member'

  const handleLogout = () => { logout(); navigate('/login'); onClose() }

  const isActive = (to) =>
    to === (isManager ? '/manager' : '/member')
      ? location.pathname === to
      : location.pathname.startsWith(to)

  const handleLink = () => onClose()

  return (
    <aside className={`sidebar${open ? ' sidebar-open' : ''}`}>
      {/* Close button inside drawer */}
      <button className="sidebar-close-btn" onClick={onClose} aria-label="Close menu">✕</button>

      {/* User profile */}
      <div className="sidebar-profile">
        <Avatar name={name} size={52} />
        <div className="sidebar-profile-info">
          <div className="sidebar-profile-name">{name}</div>
          <span className={`sidebar-role-badge ${isManager ? 'role-manager' : 'role-member'}`}>
            {role}
          </span>
        </div>
      </div>

      <div className="sidebar-divider" />

      {/* Nav links */}
      <nav className="sidebar-nav">
        <div className="sidebar-nav-label">Navigation</div>
        {nav.map(({ to, icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`sidebar-link${isActive(to) ? ' sidebar-link-active' : ''}`}
            onClick={handleLink}
          >
            <span className="sidebar-link-icon">{icon}</span>
            <span className="sidebar-link-label">{label}</span>
            {isActive(to) && <span className="sidebar-link-dot" />}
          </Link>
        ))}
      </nav>

      <div style={{ flex: 1 }} />

      {/* Logout */}
      <div className="sidebar-footer">
        <button className="sidebar-logout" onClick={handleLogout}>
          <span className="sidebar-link-icon">⏻</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  )
}
