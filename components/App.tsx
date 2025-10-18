'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AuthPage from './auth/AuthPage'
import AdminDashboard from './dashboard/AdminDashboard'
import UploaderDashboard from './dashboard/UploaderDashboard'
import VerifikatorDashboard from './dashboard/VerifikatorDashboard'
import LoadingSpinner from './LoadingSpinner'

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!user) {
    return <AuthPage />
  }

  // Render dashboard based on user role
  switch (user.role) {
    case 'admin':
      return <AdminDashboard />
    case 'uploader':
      return <UploaderDashboard />
    case 'verifikator':
      return <VerifikatorDashboard />
    default:
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Role tidak dikenali
            </h1>
            <p className="text-gray-600">
              Silakan hubungi administrator untuk bantuan
            </p>
          </div>
        </div>
      )
  }
}