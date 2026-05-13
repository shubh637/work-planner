import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { auth, logout } = useAuth()
  const navigate = useNavigate()
  const isManager = auth?.user?.role === 'MANAGER'

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <Link to={isManager ? '/manager' : '/member'} className="navbar-brand">
        Work Planner
      </Link>
      <div className="navbar-links">
        {isManager ? (
          <>
            <Link to="/manager">Dashboard</Link>
            <Link to="/manager/projects">Projects</Link>
            <Link to="/manager/tasks">Tasks</Link>
            <Link to="/manager/team">Team</Link>
            <Link to="/manager/reports">Reports</Link>
          </>
        ) : (
          <>
            <Link to="/member">Dashboard</Link>
            <Link to="/member/tasks">My Tasks</Link>
            <Link to="/member/suggest">Suggest Task</Link>
          </>
        )}
        <span className="navbar-user">
          {auth?.user?.name}
        </span>
        <button className="btn-logout" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  )
}
