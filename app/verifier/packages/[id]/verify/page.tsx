'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import MainLayout from '@/components/layout/MainLayout'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import { 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  ZoomIn, 
  ZoomOut,
  Save,
  Loader2,
  Package,
  Calendar,
  User
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface PackageData {
  id: string
  title: string
  description: string
  status: string
  createdAt: string
  uploader: {
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
}

interface ImageVerification {
  imageId: string
  status: 'APPROVED' | 'REJECTED'
}

export default function VerifyPackagePage({ params }: { params: { id: string } }) {
  const [packageData, setPackageData] = useState<PackageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [verifications, setVerifications] = useState<{ [key: string]: 'APPROVED' | 'REJECTED' }>({})
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
        
        // Initialize verifications
        const initialVerifications: { [key: string]: 'APPROVED' | 'REJECTED' } = {}
        data.package.images.forEach((image: any) => {
          if (image.verificationStatus === 'APPROVED' || image.verificationStatus === 'REJECTED') {
            initialVerifications[image.id] = image.verificationStatus
          }
        })
        setVerifications(initialVerifications)
      } else {
        error('Gagal memuat detail paket')
      }
    } catch (err) {
      error('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleVerificationChange = (imageId: string, status: 'APPROVED' | 'REJECTED') => {
    setVerifications(prev => ({
      ...prev,
      [imageId]: status
    }))
  }

  const handleSaveVerification = async () => {
    const imageVerifications: ImageVerification[] = Object.entries(verifications).map(
      ([imageId, status]) => ({ imageId, status })
    )

    if (imageVerifications.length === 0) {
      error('Pilih status verifikasi untuk setidaknya satu gambar')
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/packages/${params.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageVerifications }),
      })

      if (response.ok) {
        success('Verifikasi berhasil disimpan')
        // Redirect to packages list
        window.location.href = '/verifier/packages'
      } else {
        const data = await response.json()
        error('Gagal menyimpan verifikasi', data.error)
      }
    } catch (err) {
      error('Terjadi kesalahan saat menyimpan verifikasi')
    } finally {
      setSaving(false)
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
      <ProtectedRoute allowedRoles={['VERIFIER']}>
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
      <ProtectedRoute allowedRoles={['VERIFIER']}>
        <MainLayout>
          <div className="text-center py-12">
            <Package className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Paket tidak ditemukan
            </h3>
            <Link
              href="/verifier/packages"
              className="btn-primary inline-flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Daftar Paket</span>
            </Link>
          </div>
        </MainLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute allowedRoles={['VERIFIER']}>
      <MainLayout>
        <ToastContainer toasts={toasts} onClose={removeToast} />
        
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/verifier/packages"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-6 h-6" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Verifikasi Paket</h1>
                <p className="text-gray-600">{packageData.title}</p>
              </div>
            </div>
            
            <button
              onClick={handleSaveVerification}
              disabled={saving || Object.keys(verifications).length === 0}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Simpan Verifikasi</span>
            </button>
          </div>

          {/* Package Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Dibuat:</span>
                <span className="font-medium">
                  {new Date(packageData.createdAt).toLocaleDateString('id-ID')}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Jumlah Gambar:</span>
                <span className="font-medium">{packageData.images.length}</span>
              </div>

              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">Uploader:</span>
                <span className="font-medium">{packageData.uploader.name}</span>
              </div>
            </div>
            
            {packageData.description && (
              <p className="text-gray-600 mt-4">{packageData.description}</p>
            )}
          </div>

          {/* Images Grid */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Gambar ({packageData.images.length})
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {packageData.images.map((image) => (
                <div key={image.id} className="border border-gray-200 rounded-lg overflow-hidden">
                  <div 
                    className="aspect-square bg-gray-100 cursor-pointer"
                    onClick={() => setSelectedImage(image.filePath)}
                  >
                    <Image
                      src={image.filePath}
                      alt={image.originalName}
                      width={300}
                      height={300}
                      className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                    />
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 truncate mb-2">
                      {image.originalName}
                    </h3>
                    <p className="text-xs text-gray-500 mb-3">
                      {formatFileSize(image.fileSize)}
                    </p>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleVerificationChange(image.id, 'APPROVED')}
                        className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          verifications[image.id] === 'APPROVED'
                            ? 'bg-green-100 text-green-700 border-2 border-green-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Sesuai</span>
                      </button>
                      
                      <button
                        onClick={() => handleVerificationChange(image.id, 'REJECTED')}
                        className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          verifications[image.id] === 'REJECTED'
                            ? 'bg-red-100 text-red-700 border-2 border-red-300'
                            : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-700'
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Tidak Sesuai</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Image Modal */}
        {selectedImage && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl max-h-full">
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
              >
                <XCircle className="w-8 h-8" />
              </button>
              
              <div className="flex items-center space-x-4 mb-4">
                <button
                  onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                  className="text-white hover:text-gray-300"
                >
                  <ZoomOut className="w-6 h-6" />
                </button>
                <span className="text-white text-sm">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                  className="text-white hover:text-gray-300"
                >
                  <ZoomIn className="w-6 h-6" />
                </button>
              </div>
              
              <div className="overflow-auto max-h-[80vh]">
                <Image
                  src={selectedImage}
                  alt="Preview"
                  width={800}
                  height={600}
                  className="max-w-full h-auto"
                  style={{ transform: `scale(${zoom})` }}
                />
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    </ProtectedRoute>
  )
}