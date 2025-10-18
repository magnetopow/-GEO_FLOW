'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, authHelpers } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  register: (userData: {
    username: string
    email: string
    password: string
    role: 'admin' | 'uploader' | 'verifikator'
  }) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('auth_token')
    if (storedToken) {
      const userFromToken = authHelpers.getUserFromToken(storedToken)
      if (userFromToken) {
        setUser(userFromToken)
        setToken(storedToken)
      } else {
        localStorage.removeItem('auth_token')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const result = await authHelpers.login(email, password)
      if (result.success && result.user && result.token) {
        setUser(result.user)
        setToken(result.token)
        localStorage.setItem('auth_token', result.token)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Terjadi kesalahan saat login' }
    }
  }

  const register = async (userData: {
    username: string
    email: string
    password: string
    role: 'admin' | 'uploader' | 'verifikator'
  }) => {
    try {
      const result = await authHelpers.register(userData)
      if (result.success && result.user && result.token) {
        setUser(result.user)
        setToken(result.token)
        localStorage.setItem('auth_token', result.token)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Registration error:', error)
      return { success: false, error: 'Terjadi kesalahan saat mendaftar' }
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('auth_token')
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}