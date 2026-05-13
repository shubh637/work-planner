import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RoleRoute({ role }) {
  const { auth } = useAuth()
  return auth?.user?.role === role ? <Outlet /> : <Navigate to="/unauthorized" replace />
}
