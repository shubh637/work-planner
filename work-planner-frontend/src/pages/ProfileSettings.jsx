import React, { useState } from 'react'
import Layout from '../components/Layout'
import { userApi } from '../api/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

function isDark() {
  return document.documentElement.getAttribute('data-theme') === 'dark'
}

export default function ProfileSettings() {
  const { auth, login } = useAuth()
  const { showToast } = useToast()
  const user = auth?.user || {}

  const [name, setName]               = useState(user.name || '')
  const [savingName, setSavingName]   = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPw, setConfirmPw]     = useState('')
  const [savingPw, setSavingPw]       = useState(false)
  const [darkMode, setDarkMode]       = useState(isDark)

  const handleSaveName = async (e) => {
    e.preventDefault()
    if (!name.trim()) { showToast('Name cannot be empty.', 'error'); return }
    setSavingName(true)
    try {
      await userApi.update(user.id, { name: name.trim(), email: user.email, role: user.role })
      login(auth.token, { ...user, name: name.trim() })
      showToast('Name updated successfully.')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update name.', 'error')
    } finally { setSavingName(false) }
  }

  const handleSavePassword = async (e) => {
    e.preventDefault()
    if (!newPassword) { showToast('Enter a new password.', 'error'); return }
    if (newPassword.length < 6) { showToast('Password must be at least 6 characters.', 'error'); return }
    if (newPassword !== confirmPw) { showToast('Passwords do not match.', 'error'); return }
    setSavingPw(true)
    try {
      await userApi.update(user.id, { name: user.name, email: user.email, role: user.role, password: newPassword })
      setNewPassword(''); setConfirmPw('')
      showToast('Password updated successfully.')
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update password.', 'error')
    } finally { setSavingPw(false) }
  }

  const toggleDarkMode = () => {
    const next = !darkMode
    setDarkMode(next)
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light')
    localStorage.setItem('wp_theme', next ? 'dark' : 'light')
  }

  return (
    <Layout>
      <div className="page container">
        <div className="page-header" style={{ marginBottom: '24px' }}>
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Manage your account</p>
          </div>
        </div>

        {/* Appearance */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <h3 className="section-title" style={{ marginBottom: '16px' }}>Appearance</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text)', marginBottom: '3px' }}>Dark Mode</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-3)' }}>Switch between light and dark theme</div>
            </div>
            <button
              onClick={toggleDarkMode}
              style={{
                width: 48, height: 26, borderRadius: '999px', border: 'none', cursor: 'pointer',
                background: darkMode ? 'var(--brand)' : 'var(--border-2)',
                position: 'relative', flexShrink: 0, transition: 'background 0.2s',
              }}
              aria-label="Toggle dark mode"
            >
              <span style={{
                position: 'absolute', top: 3, left: darkMode ? 25 : 3,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {darkMode
                  ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                  : <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
                }
              </span>
            </button>
          </div>
        </div>

        {/* Account info */}
        <div className="card" style={{ marginBottom: '16px' }}>
          <h3 className="section-title" style={{ marginBottom: '16px' }}>Account Info</h3>
          <div style={{ marginBottom: '14px', fontSize: '0.875rem' }}>
            <div className="detail-label">Email</div>
            <div className="detail-value" style={{ marginTop: '4px' }}>{user.email}</div>
          </div>
          <form onSubmit={handleSaveName}>
            <div className="form-group">
              <label className="form-label">Display Name</label>
              <input className="form-control" value={name} onChange={e => setName(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingName || name.trim() === user.name}>
              {savingName ? 'Saving…' : 'Save Name'}
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="card">
          <h3 className="section-title" style={{ marginBottom: '16px' }}>Change Password</h3>
          <form onSubmit={handleSavePassword}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input type="password" className="form-control" value={newPassword}
                onChange={e => setNewPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" className="form-control" value={confirmPw}
                onChange={e => setConfirmPw(e.target.value)} placeholder="Repeat new password" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingPw || !newPassword}>
              {savingPw ? 'Saving…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}
