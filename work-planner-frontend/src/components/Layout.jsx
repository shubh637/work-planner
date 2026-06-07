import React, { useState } from 'react'
import Topbar from './Topbar'
import Sidebar from './Sidebar'

export default function Layout({ children }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="app-shell">
      <Topbar onMenuClick={() => setOpen(o => !o)} />

      {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} />}
      <Sidebar open={open} onClose={() => setOpen(false)} />

      <main className="app-main">
        {children}
      </main>
    </div>
  )
}
