'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import MainLayout from '@/components/layout/MainLayout'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import { 
  Package, 
  Eye, 
  Clock, 
  CheckCircle, 
  XCircle,
  Calendar,
  User,
  Download,
  Loader2,
  FileText,
  Search
} from 'lucide-react'
import Link from 'next/link'

interface PackageData {
  id: string
  title: string
  description: string
  status: string
  createdAt: string
  updatedAt: string
  uploader: {
    id: string
    name: string
    email: string
  }
  verifier?: {
    id: string
    name: string
    email: string
  }
  images: Array<{
    id: string
    originalName: string
    filePath: string
    isVerified: boolean
    verificationStatus: string
  }>
  document?: {
    id: string
    title: string
    filePath: string
  }
  _count: {
    images: number
  }
}

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<PackageData[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchTerm, setSearchTerm] = useState('')
  const { toasts, removeToast, success, error } = useToast()

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages')
      if (response.ok) {
        const data = await response.json()
        setPackages(data.packages)
      } else {
        error('Gagal memuat data paket')
      }
    } catch (err) {
      error('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'PENDING_VERIFICATION':
        return {
          text: 'Menunggu Verifikasi',
          icon: Clock,
          color: 'text-yellow-600 bg-yellow-100'
        }
      case 'VERIFIED':
        return {
          text: 'Terverifikasi',
          icon: CheckCircle,
          color: 'text-green-600 bg-green-100'
        }
      case 'REJECTED':
        return {
          text: 'Ditolak',
          icon: XCircle,
          color: 'text-red-600 bg-red-100'
        }
      case 'COMPILED':
        return {
          text: 'Terkompilasi',
          icon: FileText,
          color: 'text-blue-600 bg-blue-100'
        }
      default:
        return {
          text: status,
          icon: Clock,
          color: 'text-gray-600 bg-gray-100'
        }
    }
  }

  const filteredPackages = packages.filter(pkg => {
    const matchesStatus = filterStatus === 'ALL' || pkg.status === filterStatus
    const matchesSearch = pkg.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pkg.uploader.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesStatus && matchesSearch
  })

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['ADMIN']}>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <MainLayout>
        <ToastContainer toasts={toasts} onClose={removeToast} />
        
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Semua Paket</h1>
            <p className="text-gray-600">Daftar semua paket dalam sistem</p>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Cari paket atau uploader..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Filter Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="ALL">Semua</option>
                  <option value="PENDING_VERIFICATION">Menunggu Verifikasi</option>
                  <option value="VERIFIED">Terverifikasi</option>
                  <option value="REJECTED">Ditolak</option>
                  <option value="COMPILED">Terkompilasi</option>
                </select>
              </div>
            </div>
          </div>

          {/* Packages List */}
          <div className="space-y-4">
            {filteredPackages.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-24 h-24 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Tidak ada paket ditemukan
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Belum ada paket yang dibuat'}
                </p>
              </div>
            ) : (
              filteredPackages.map((pkg) => {
                const statusInfo = getStatusDisplay(pkg.status)
                const StatusIcon = statusInfo.icon

                return (
                  <div key={pkg.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {pkg.title}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.text}
                          </span>
                        </div>
                        
                        {pkg.description && (
                          <p className="text-gray-600 mb-3">{pkg.description}</p>
                        )}

                        <div className="flex items-center space-x-6 text-sm text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4" />
                            <span>Dibuat: {new Date(pkg.createdAt).toLocaleDateString('id-ID')}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Package className="w-4 h-4" />
                            <span>{pkg._count.images} gambar</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4" />
                            <span>Oleh {pkg.uploader.name}</span>
                          </div>
                          {pkg.verifier && (
                            <div className="flex items-center space-x-1">
                              <CheckCircle className="w-4 h-4" />
                              <span>Diverifikasi oleh {pkg.verifier.name}</span>
                            </div>
                          )}
                        </div>

                        {/* Images Preview */}
                        <div className="mt-4">
                          <div className="flex space-x-2">
                            {pkg.images.slice(0, 4).map((image) => (
                              <div key={image.id} className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                                <img
                                  src={image.filePath}
                                  alt={image.originalName}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ))}
                            {pkg.images.length > 4 && (
                              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                                <span className="text-xs text-gray-500">
                                  +{pkg.images.length - 4}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Link
                          href={`/admin/packages/${pkg.id}`}
                          className="text-primary-600 hover:text-primary-900"
                          title="Lihat Detail"
                        >
                          <Eye className="w-5 h-5" />
                        </Link>
                        
                        {pkg.document && (
                          <a
                            href={pkg.document.filePath}
                            download
                            className="text-green-600 hover:text-green-900"
                            title="Unduh PDF"
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}