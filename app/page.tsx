'use client'

import { AuthProvider, useAuth } from '@/components/AuthProvider'
import LoginForm from '@/components/LoginForm'
import AdminDashboard from '@/components/AdminDashboard'
import UploaderDashboard from '@/components/UploaderDashboard'
import VerifierDashboard from '@/components/VerifierDashboard'
import { LogOut, User } from 'lucide-react'

function MainContent() {
  const { user, logout, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!user) {
    return <LoginForm />
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'ADMIN':
        return <AdminDashboard />
      case 'UPLOADER':
        return <UploaderDashboard />
      case 'VERIFIER':
        return <VerifierDashboard />
      default:
        return <LoginForm />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Sistem Verifikasi & Kompilasi Dokumen
              </h1>
              <p className="text-sm text-gray-600">
                Platform internal untuk mengelola pengunggahan, verifikasi, dan kompilasi gambar
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-400" />
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{user.username}</p>
                  <p className="text-gray-500 capitalize">{user.role.toLowerCase()}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Keluar
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {renderDashboard()}
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  )
}