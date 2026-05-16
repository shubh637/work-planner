import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api/api'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login({ email, password })
      const { token, role, userId, name } = res.data
      login(token, { userId, role, name, email })
      navigate(role === 'MANAGER' ? '/manager' : '/member')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">✦</div>
        <div className="login-title">Work Planner</div>
        <div className="login-subtitle">Sign in to your account</div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={email}
              onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input className="form-control" type="password" value={password}
              onChange={e => setPassword(e.target.value)} required />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}
            type="submit" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          <p style={{ textAlign: 'right', marginTop: '0.5rem', fontSize: '0.875rem' }}>
            <Link to="/forgot-password" style={{ color: '#2563eb' }}>Forgot password?</Link>
          </p>
        </form>
        <p style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#94a3b8' }}>
          Default manager: manager@workplanner.com / admin123
        </p>
      </div>
    </div>
  )
}
