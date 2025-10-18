'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Upload, 
  CheckCircle, 
  Users, 
  FileText, 
  Home,
  Package
} from 'lucide-react'

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator'
      case 'UPLOADER':
        return 'Pengunggah'
      case 'VERIFIER':
        return 'Verifikator'
      default:
        return role
    }
  }

  const getNavigationItems = () => {
    if (!session) return []

    const baseItems = [
      {
        name: 'Dashboard',
        href: '/dashboard',
        icon: Home,
        roles: ['ADMIN', 'UPLOADER', 'VERIFIER']
      }
    ]

    if (session.user.role === 'ADMIN') {
      return [
        ...baseItems,
        {
          name: 'Kelola Pengguna',
          href: '/admin/users',
          icon: Users,
          roles: ['ADMIN']
        },
        {
          name: 'Semua Paket',
          href: '/admin/packages',
          icon: Package,
          roles: ['ADMIN']
        }
      ]
    }

    if (session.user.role === 'UPLOADER') {
      return [
        ...baseItems,
        {
          name: 'Upload Gambar',
          href: '/uploader/upload',
          icon: Upload,
          roles: ['UPLOADER']
        },
        {
          name: 'Riwayat Upload',
          href: '/uploader/history',
          icon: FileText,
          roles: ['UPLOADER']
        }
      ]
    }

    if (session.user.role === 'VERIFIER') {
      return [
        ...baseItems,
        {
          name: 'Verifikasi Paket',
          href: '/verifier/packages',
          icon: CheckCircle,
          roles: ['VERIFIER']
        },
        {
          name: 'Riwayat Verifikasi',
          href: '/verifier/history',
          icon: FileText,
          roles: ['VERIFIER']
        }
      ]
    }

    return baseItems
  }

  const navigationItems = getNavigationItems()

  return (
    <div className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <div className="p-6">
        <div className="text-sm text-gray-500 mb-4">
          {getRoleDisplayName(session?.user.role || '')}
        </div>
        
        <nav className="space-y-2">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href
            const Icon = item.icon
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}