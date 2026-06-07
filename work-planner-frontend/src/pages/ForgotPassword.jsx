import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import axiosInstance from '../api/axiosInstance'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await axiosInstance.post('/auth/forgot-password', { email })
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">✦</div>
        <div className="login-title">Work Planner</div>
        <h2 style={{ textAlign: 'center', color: '#16a34a', margin: '1rem 0 0.5rem' }}>Check your email</h2>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '1.5rem' }}>
          If an account exists for <strong>{email}</strong>, a reset link has been sent.
        </p>
        <Link to="/login" className="btn btn-secondary" style={{ display: 'block', textAlign: 'center' }}>
          Back to Login
        </Link>
      </div>
    </div>
  )

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">✦</div>
        <div className="login-title">Work Planner</div>
        <div className="login-subtitle">Enter your email to reset your password</div>
        {error && <div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-control" type="email" value={email} required autoFocus
              onChange={e => setEmail(e.target.value)} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }} disabled={loading}>
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem' }}>
          <Link to="/login" style={{ color: '#2563eb' }}>Back to Login</Link>
        </p>
      </div>
    </div>
  )
}
