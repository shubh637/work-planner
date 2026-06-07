import React, { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('wp_token')
    const user  = JSON.parse(localStorage.getItem('wp_user') || 'null')
    return token ? { token, user } : null
  })

  const login = useCallback((token, user) => {
    localStorage.setItem('wp_token', token)
    localStorage.setItem('wp_user', JSON.stringify(user))
    setAuth({ token, user })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('wp_token')
    localStorage.removeItem('wp_user')
    setAuth(null)
  }, [])

  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
