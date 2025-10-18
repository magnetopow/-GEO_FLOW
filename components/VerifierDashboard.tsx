'use client'

import { useState, useEffect } from 'react'
import { useAuth } from './AuthProvider'
import { Package, Eye, CheckCircle, XCircle, Clock, ZoomIn, ZoomOut } from 'lucide-react'
import Image from 'next/image'

interface PackageData {
  id: string
  name: string
  description?: string
  uploadedBy: string
  uploadedAt: string
  verifiedAt?: string
  verifiedBy?: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'COMPILED'
  imageCount: number
  images: Array<{
    id: string
    originalName: string
    filename: string
    filePath: string
    size: number
    mimeType: string
    uploadedBy: string
    uploadedAt: string
    verifiedAt?: string
    verifiedBy?: string
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
    verificationNotes?: string
  }>
}

interface VerificationData {
  id: string
  packageId: string
  imageId: string
  verifierId: string
  status: 'APPROVED' | 'REJECTED'
  notes?: string
  verifiedAt: string
}

export default function VerifierDashboard() {
  const { user, token } = useAuth()
  const [packages, setPackages] = useState<PackageData[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPackage, setSelectedPackage] = useState<PackageData | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [verificationNotes, setVerificationNotes] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  useEffect(() => {
    if (user?.role === 'VERIFIER') {
      fetchPackages()
    }
  }, [user])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setPackages(data.packages)
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPackageDetail = async (packageId: string) => {
    try {
      const response = await fetch(`/api/packages/${packageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setSelectedPackage(data.package)
        setCurrentImageIndex(0)
        setZoomLevel(100)
        setVerificationNotes('')
      }
    } catch (error) {
      console.error('Error fetching package detail:', error)
    }
  }

  const verifyImage = async (imageId: string, status: 'APPROVED' | 'REJECTED') => {
    if (!selectedPackage) return

    setIsVerifying(true)
    try {
      const response = await fetch('/api/verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          imageId,
          status,
          notes: verificationNotes || undefined,
        }),
      })

      if (response.ok) {
        // Update local state
        setSelectedPackage(prev => {
          if (!prev) return prev
          return {
            ...prev,
            images: prev.images.map(img => 
              img.id === imageId 
                ? { 
                    ...img, 
                    status, 
                    verifiedBy: user?.id, 
                    verifiedAt: new Date().toISOString(),
                    verificationNotes: verificationNotes || undefined
                  }
                : img
            )
          }
        })

        // Move to next image
        const nextIndex = currentImageIndex + 1
        if (nextIndex < selectedPackage.images.length) {
          setCurrentImageIndex(nextIndex)
        } else {
          // All images verified, update package status
          const allVerified = selectedPackage.images.every(img => 
            img.id === imageId ? status !== 'PENDING' : img.status !== 'PENDING'
          )
          
          if (allVerified) {
            await updatePackageStatus('VERIFIED')
          }
        }

        setVerificationNotes('')
      } else {
        const error = await response.json()
        alert(error.error || 'Gagal memverifikasi gambar')
      }
    } catch (error) {
      console.error('Error verifying image:', error)
      alert('Terjadi kesalahan saat memverifikasi gambar')
    } finally {
      setIsVerifying(false)
    }
  }

  const updatePackageStatus = async (status: string) => {
    if (!selectedPackage) return

    try {
      const response = await fetch(`/api/packages/${selectedPackage.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchPackages()
        setSelectedPackage(prev => prev ? { ...prev, status: status as any } : null)
      }
    } catch (error) {
      console.error('Error updating package status:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'VERIFIED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'COMPILED':
        return <CheckCircle className="w-4 h-4 text-blue-500" />
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Menunggu Verifikasi'
      case 'VERIFIED':
        return 'Terverifikasi'
      case 'COMPILED':
        return 'Terkompilasi'
      case 'REJECTED':
        return 'Ditolak'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'VERIFIED':
        return 'bg-green-100 text-green-800'
      case 'COMPILED':
        return 'bg-blue-100 text-blue-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getImageStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getImageStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Belum Diverifikasi'
      case 'APPROVED':
        return 'Disetujui'
      case 'REJECTED':
        return 'Ditolak'
      default:
        return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Verifikator</h1>
          <p className="mt-2 text-gray-600">Verifikasi paket dokumen yang menunggu</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Paket</p>
                <p className="text-2xl font-semibold text-gray-900">{packages.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Menunggu Verifikasi</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {packages.filter(p => p.status === 'PENDING').length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Terverifikasi</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {packages.filter(p => p.status === 'VERIFIED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Packages List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Paket yang Menunggu Verifikasi</h2>
          </div>

          {packages.length === 0 ? (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Tidak ada paket</h3>
              <p className="mt-1 text-sm text-gray-500">Belum ada paket yang perlu diverifikasi</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nama Paket
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jumlah Gambar
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanggal Upload
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {packages.map((pkg) => (
                    <tr key={pkg.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                          {pkg.description && (
                            <div className="text-sm text-gray-500">{pkg.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {pkg.imageCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(pkg.status)}`}>
                          {getStatusIcon(pkg.status)}
                          <span className="ml-1">{getStatusText(pkg.status)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(pkg.uploadedAt).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => fetchPackageDetail(pkg.id)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Verifikasi Paket"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Verification Modal */}
        {selectedPackage && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Verifikasi: {selectedPackage.name}
                  </h3>
                  <button
                    onClick={() => setSelectedPackage(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Image Viewer */}
                  <div className="lg:col-span-2">
                    <div className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="text-md font-medium text-gray-900">
                          Gambar {currentImageIndex + 1} dari {selectedPackage.images.length}
                        </h4>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setZoomLevel(Math.max(50, zoomLevel - 25))}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <ZoomOut className="h-4 w-4" />
                          </button>
                          <span className="text-sm text-gray-500">{zoomLevel}%</span>
                          <button
                            onClick={() => setZoomLevel(Math.min(200, zoomLevel + 25))}
                            className="p-1 text-gray-400 hover:text-gray-600"
                          >
                            <ZoomIn className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-center items-center bg-gray-100 rounded-lg p-4 mb-4">
                        <Image
                          src={selectedPackage.images[currentImageIndex]?.filePath || ''}
                          alt={selectedPackage.images[currentImageIndex]?.originalName || ''}
                          width={400}
                          height={300}
                          className="rounded-lg"
                          style={{ 
                            transform: `scale(${zoomLevel / 100})`,
                            maxWidth: '100%',
                            height: 'auto'
                          }}
                        />
                      </div>

                      <div className="text-sm text-gray-600">
                        <p><strong>Nama File:</strong> {selectedPackage.images[currentImageIndex]?.originalName}</p>
                        <p><strong>Status:</strong> 
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getImageStatusColor(selectedPackage.images[currentImageIndex]?.status || 'PENDING')}`}>
                            {getImageStatusText(selectedPackage.images[currentImageIndex]?.status || 'PENDING')}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Verification Controls */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Verifikasi Gambar</h4>
                      
                      <div className="space-y-3">
                        <button
                          onClick={() => verifyImage(selectedPackage.images[currentImageIndex]?.id || '', 'APPROVED')}
                          disabled={isVerifying || selectedPackage.images[currentImageIndex]?.status !== 'PENDING'}
                          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {isVerifying ? 'Memproses...' : 'Setujui'}
                        </button>

                        <button
                          onClick={() => verifyImage(selectedPackage.images[currentImageIndex]?.id || '', 'REJECTED')}
                          disabled={isVerifying || selectedPackage.images[currentImageIndex]?.status !== 'PENDING'}
                          className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {isVerifying ? 'Memproses...' : 'Tolak'}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Catatan Verifikasi (Opsional)
                      </label>
                      <textarea
                        value={verificationNotes}
                        onChange={(e) => setVerificationNotes(e.target.value)}
                        rows={3}
                        className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Masukkan catatan verifikasi..."
                      />
                    </div>

                    {/* Navigation */}
                    <div className="flex justify-between">
                      <button
                        onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                        disabled={currentImageIndex === 0}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Sebelumnya
                      </button>
                      <button
                        onClick={() => setCurrentImageIndex(Math.min(selectedPackage.images.length - 1, currentImageIndex + 1))}
                        disabled={currentImageIndex === selectedPackage.images.length - 1}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Selanjutnya
                      </button>
                    </div>

                    {/* Progress */}
                    <div className="text-sm text-gray-600">
                      <p>Progress: {selectedPackage.images.filter(img => img.status !== 'PENDING').length} / {selectedPackage.images.length}</p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(selectedPackage.images.filter(img => img.status !== 'PENDING').length / selectedPackage.images.length) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}