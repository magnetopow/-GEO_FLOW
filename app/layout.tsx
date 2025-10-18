import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import ErrorBoundary from '@/components/ErrorBoundary'
import { SessionProvider } from 'next-auth/react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Aplikasi Verifikasi Dokumen',
  description: 'Aplikasi internal untuk mengelola proses pengunggahan, verifikasi, dan kompilasi gambar',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <SessionProvider>
          <ErrorBoundary>
            <div className="min-h-screen bg-gray-50">
              {children}
            </div>
          </ErrorBoundary>
        </SessionProvider>
      </body>
    </html>
  )
}