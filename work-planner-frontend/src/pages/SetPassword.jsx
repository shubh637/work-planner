import React, { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'

export default function SetPassword() {
  const [params] = useSearchParams()
  const navigate  = useNavigate()
  const token     = params.get('token')

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)
  const [loading, setLoading]     = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      await axiosInstance.post('/auth/set-password', { token, password })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired link.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">✦</div>
        <div className="login-title">Work Planner</div>
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>Invalid link. Please contact your manager.</div>
      </div>
    </div>
  )

  if (success) return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">✦</div>
        <div className="login-title">Work Planner</div>
        <h2 style={{ textAlign: 'center', color: '#16a34a', marginBottom: '0.5rem' }}>Password Set!</h2>
        <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#64748b' }}>
          Your password has been set successfully.
        </p>
        <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => navigate('/login')}>
          Go to Login
        </button>
      </div>
    </div>
  )

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">✦</div>
        <div className="login-title">Work Planner</div>
        <div className="login-subtitle">Set your password to activate your account</div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input className="form-control" type="password" value={password} required autoFocus
              onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input className="form-control" type="password" value={confirm} required
              onChange={e => setConfirm(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Saving...' : 'Set Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
