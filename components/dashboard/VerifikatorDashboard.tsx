'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { CheckSquare, FileText, Clock } from 'lucide-react'
import ImageVerifier from '../verifikator/ImageVerifier'
import DocumentCompiler from '../compiler/DocumentCompiler'

export default function VerifikatorDashboard() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('verify')

  const tabs = [
    { id: 'verify', label: 'Verifikasi Gambar', icon: CheckSquare },
    { id: 'compile', label: 'Kompilasi Dokumen', icon: FileText }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Verifikator</h1>
              <p className="text-gray-600">Selamat datang, {user?.username}</p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Role: Verifikator</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'verify' && <ImageVerifier token={user?.token || ''} />}
        {activeTab === 'compile' && <DocumentCompiler token={user?.token || ''} />}
      </div>
    </div>
  )
}