'use client'

import React, { useState } from 'react'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Aplikasi Verifikasi Dokumen
          </h1>
          <p className="text-gray-600">
            Sistem manajemen verifikasi dan kompilasi dokumen gambar
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {isLogin ? (
          <LoginForm 
            onSuccess={() => {}} 
            onSwitchToRegister={() => setIsLogin(false)} 
          />
        ) : (
          <RegisterForm 
            onSuccess={() => {}} 
            onSwitchToLogin={() => setIsLogin(true)} 
          />
        )}
      </div>
    </div>
  )
}