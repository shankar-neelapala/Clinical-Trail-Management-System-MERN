import React, { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, usersAPI } from '../api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('ctms_token')
    if (token) {
      authAPI.me()
        .then(r => setUser(r.data.user))
        .catch(() => localStorage.removeItem('ctms_token'))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (email, password) => {
    const r = await authAPI.login({ email, password })
    localStorage.setItem('ctms_token', r.data.token)
    setUser(r.data.user)
    return r.data.user
  }

  const logout = () => {
    localStorage.removeItem('ctms_token')
    setUser(null)
  }

  const updateProfile = async (data) => {
    const r = await usersAPI.updateProfile(data)
    setUser(r.data.user)
    return r.data.user
  }

  const changePassword = (data) => usersAPI.changePassword(data)

  // Role helpers
  const isAdmin       = user?.role === 'admin'
  const isDoctor      = user?.role === 'doctor'
  const isNurse       = user?.role === 'nurse'
  const isCoordinator = user?.role === 'coordinator'
  const canEdit       = ['admin', 'coordinator', 'doctor', 'nurse'].includes(user?.role)
  const canDelete     = user?.role === 'admin'

  return (
    <AuthCtx.Provider value={{ user, loading, login, logout, updateProfile, changePassword, isAdmin, isDoctor, isNurse, isCoordinator, canEdit, canDelete }}>
      {children}
    </AuthCtx.Provider>
  )
}

export const useAuth = () => useContext(AuthCtx)
