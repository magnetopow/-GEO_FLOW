'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import MainLayout from '@/components/layout/MainLayout'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import { 
  ArrowLeft, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  Calendar,
  Download,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

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
    fileSize: number
    mimeType: string
    isVerified: boolean
    verificationStatus: string
  }>
  document?: {
    id: string
    title: string
    filePath: string
    fileSize: number
    createdAt: string
  }
}

export default function PackageDetailPage({ params }: { params: { id: string } }) {
  const [packageData, setPackageData] = useState<PackageData | null>(null)
  const [loading, setLoading] = useState(true)
  const { toasts, removeToast, success, error } = useToast()

  useEffect(() => {
    fetchPackage()
  }, [params.id])

  const fetchPackage = async () => {
    try {
      const response = await fetch(`/api/packages/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setPackageData(data.package)
      } else {
        error('Gagal memuat detail paket')
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
          icon: Package,
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

  const getVerificationStatusDisplay = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return {
          text: 'Disetujui',
          icon: CheckCircle,
          color: 'text-green-600 bg-green-100'
        }
      case 'REJECTED':
        return {
          text: 'Ditolak',
          icon: XCircle,
          color: 'text-red-600 bg-red-100'
        }
      default:
        return {
          text: 'Menunggu',
          icon: Clock,
          color: 'text-yellow-600 bg-yellow-100'
        }
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['UPLOADER']}>
        <MainLayout>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  if (!packageData) {
    return (
      <ProtectedRoute allowedRoles={['UPLOADER']}>
        <MainLayout>
          <div className="text-center py-12">
            <Package className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Paket tidak ditemukan
            </h3>
            <Link
              href="/uploader/history"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Riwayat</span>
            </Link>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  const statusInfo = getStatusDisplay(packageData.status)
  const StatusIcon = statusInfo.icon

  return (
    <ProtectedRoute allowedRoles={['UPLOADER']}>
      <MainLayout>
        <ToastContainer toasts={toasts} onClose={removeToast} />
        
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Link
              href="/uploader/history"
              className="text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{packageData.title}</h1>
              <p className="text-gray-600">Detail paket gambar</p>
            </div>
          </div>

          {/* Package Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">
                  Informasi Paket
                </h2>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                    <StatusIcon className="w-4 h-4 mr-1" />
                    {statusInfo.text}
                  </span>
                </div>
              </div>
            </div>

            {packageData.description && (
              <p className="text-gray-600 mb-4">{packageData.description}</p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Dibuat:</span>
                <span className="font-medium">
                  {new Date(packageData.createdAt).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Jumlah Gambar:</span>
                <span className="font-medium">{packageData.images.length}</span>
              </div>

              {packageData.verifier && (
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Diverifikasi oleh:</span>
                  <span className="font-medium">{packageData.verifier.name}</span>
                </div>
              )}

              {packageData.document && (
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">Dokumen:</span>
                  <a
                    href={packageData.document.filePath}
                    download
                    className="font-medium text-primary-600 hover:text-primary-800"
                  >
                    {packageData.document.title}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Images */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Gambar ({packageData.images.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packageData.images.map((image) => {
                const verificationStatus = getVerificationStatusDisplay(image.verificationStatus)
                const VerificationIcon = verificationStatus.icon

                return (
                  <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="aspect-square bg-gray-100">
                      <Image
                        src={image.filePath}
                        alt={image.originalName}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {image.originalName}
                        </h3>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${verificationStatus.color}`}>
                          <VerificationIcon className="w-3 h-3 mr-1" />
                          {verificationStatus.text}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(image.fileSize)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}