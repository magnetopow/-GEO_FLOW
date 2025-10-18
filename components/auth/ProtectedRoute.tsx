'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: string[]
  fallbackPath?: string
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  fallbackPath = '/auth/signin' 
}: ProtectedRouteProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push(fallbackPath)
      return
    }

    if (!allowedRoles.includes(session.user.role)) {
      router.push('/unauthorized')
      return
    }
  }, [session, status, router, allowedRoles, fallbackPath])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!session || !allowedRoles.includes(session.user.role)) {
    return null
  }

  return <>{children}</>
}