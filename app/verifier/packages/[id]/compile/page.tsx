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
  Download,
  FileText,
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
  document?: {
    id: string
    title: string
    filePath: string
    fileSize: number
    createdAt: string
  }
}

export default function CompilePackagePage({ params }: { params: { id: string } }) {
  const [packageData, setPackageData] = useState<PackageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [compiling, setCompiling] = useState(false)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
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
        
        // Auto-select all approved images
        const approvedImages = data.package.images
          .filter((img: any) => img.verificationStatus === 'APPROVED')
          .map((img: any) => img.id)
        setSelectedImages(approvedImages)
      } else {
        error('Gagal memuat detail paket')
      }
    } catch (err) {
      error('Terjadi kesalahan saat memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (imageId: string) => {
    setSelectedImages(prev => 
      prev.includes(imageId) 
        ? prev.filter(id => id !== imageId)
        : [...prev, imageId]
    )
  }

  const handleSelectAll = () => {
    if (!packageData) return
    
    const approvedImages = packageData.images
      .filter(img => img.verificationStatus === 'APPROVED')
      .map(img => img.id)
    
    setSelectedImages(approvedImages)
  }

  const handleSelectNone = () => {
    setSelectedImages([])
  }

  const handleCompile = async () => {
    if (selectedImages.length === 0) {
      error('Pilih setidaknya satu gambar untuk dikompilasi')
      return
    }

    setCompiling(true)

    try {
      const response = await fetch(`/api/packages/${params.id}/compile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedImageIds: selectedImages }),
      })

      if (response.ok) {
        const data = await response.json()
        success('Dokumen berhasil dikompilasi', 'PDF telah dibuat dan siap diunduh')
        
        // Refresh package data to get the new document
        fetchPackage()
      } else {
        const data = await response.json()
        error('Gagal mengompilasi dokumen', data.error)
      }
    } catch (err) {
      error('Terjadi kesalahan saat mengompilasi dokumen')
    } finally {
      setCompiling(false)
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
      <ProtectedRoute allowedRoles={['VERIFIER', 'UPLOADER']}>
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
      <ProtectedRoute allowedRoles={['VERIFIER', 'UPLOADER']}>
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

  const approvedImages = packageData.images.filter(img => img.verificationStatus === 'APPROVED')

  return (
    <ProtectedRoute allowedRoles={['VERIFIER', 'UPLOADER']}>
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
                <h1 className="text-2xl font-bold text-gray-900">Kompilasi Dokumen</h1>
                <p className="text-gray-600">{packageData.title}</p>
              </div>
            </div>
            
            {packageData.document ? (
              <a
                href={packageData.document.filePath}
                download
                className="btn-primary flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Unduh PDF</span>
              </a>
            ) : (
              <button
                onClick={handleCompile}
                disabled={compiling || selectedImages.length === 0}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                {compiling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileText className="w-4 h-4" />
                )}
                <span>Buat PDF</span>
              </button>
            )}
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
                <span className="text-gray-600">Gambar Disetujui:</span>
                <span className="font-medium">{approvedImages.length}</span>
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

          {/* Document Status */}
          {packageData.document && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h3 className="text-lg font-medium text-green-800">Dokumen Telah Dibuat</h3>
              </div>
              <p className="text-green-700 mt-2">
                Dokumen PDF telah berhasil dikompilasi dan siap diunduh.
              </p>
              <div className="mt-3 flex items-center space-x-4 text-sm text-green-600">
                <span>Ukuran: {formatFileSize(packageData.document.fileSize)}</span>
                <span>Dibuat: {new Date(packageData.document.createdAt).toLocaleDateString('id-ID')}</span>
              </div>
            </div>
          )}

          {/* Image Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Pilih Gambar untuk Dikompilasi ({selectedImages.length} dipilih)
              </h2>
              <div className="flex space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-primary-600 hover:text-primary-800"
                >
                  Pilih Semua
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={handleSelectNone}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Batal Pilih
                </button>
              </div>
            </div>
            
            {approvedImages.length === 0 ? (
              <div className="text-center py-8">
                <XCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Tidak ada gambar yang disetujui untuk dikompilasi</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {approvedImages.map((image) => (
                  <div 
                    key={image.id} 
                    className={`border-2 rounded-lg overflow-hidden cursor-pointer transition-all ${
                      selectedImages.includes(image.id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleImageSelect(image.id)}
                  >
                    <div className="aspect-square bg-gray-100">
                      <Image
                        src={image.filePath}
                        alt={image.originalName}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="p-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {image.originalName}
                        </h3>
                        {selectedImages.includes(image.id) && (
                          <CheckCircle className="w-4 h-4 text-primary-600 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(image.fileSize)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}