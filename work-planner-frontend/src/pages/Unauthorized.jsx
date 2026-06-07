import React from 'react'
import { Link } from 'react-router-dom'

export default function Unauthorized() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', color: '#dc2626' }}>403</h1>
        <p style={{ color: '#64748b', marginBottom: '1rem' }}>You don't have permission to view this page.</p>
        <Link to="/login" className="btn btn-primary">Go to Login</Link>
      </div>
    </div>
  )
}
