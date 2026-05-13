import React from 'react'

export default function Topbar({ onMenuClick }) {
  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="topbar-brand-icon">✦</div>
        <span className="topbar-brand-text">Work Planner</span>
      </div>
      <button className="topbar-menu-btn" onClick={onMenuClick} aria-label="Open menu">
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>
    </header>
  )
}
