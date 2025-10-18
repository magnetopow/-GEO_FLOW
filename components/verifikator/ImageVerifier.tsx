'use client'

import React, { useState, useEffect } from 'react'
import { useToast } from '@/hooks/useToast'
import { CheckCircle, XCircle, Eye, ZoomIn, ZoomOut, RotateCcw, Package, Clock, CheckSquare } from 'lucide-react'
import Image from 'next/image'

interface UploadedFile {
  id: string
  originalName: string
  filename: string
  size: number
  type: string
  url: string
  uploadDate: string
  verification_status?: string
  notes?: string
  verified_at?: string
  verifier_name?: string
}

interface DocumentPackage {
  id: string
  title: string
  description?: string
  status: 'pending' | 'verified' | 'rejected' | 'completed'
  uploader_name: string
  file_count: number
  verified_count: number
  created_at: string
  files: UploadedFile[]
}

interface ImageVerifierProps {
  token: string
}

export default function ImageVerifier({ token }: ImageVerifierProps) {
  const [packages, setPackages] = useState<DocumentPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<DocumentPackage | null>(null)
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [verifications, setVerifications] = useState<{ [fileId: string]: { status: string; notes: string } }>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showImageViewer, setShowImageViewer] = useState(false)
  const [imageScale, setImageScale] = useState(1)
  
  const { toasts, removeToast, success, error } = useToast()

  useEffect(() => {
    fetchPackages()
  }, [])

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/packages', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setPackages(data.packages)
      } else {
        error('Gagal mengambil data paket')
      }
    } catch (err) {
      error('Gagal mengambil data paket')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchPackageDetails = async (packageId: string) => {
    try {
      const response = await fetch(`/api/packages/${packageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSelectedPackage(data.package)
        
        // Initialize verifications
        const initialVerifications: { [fileId: string]: { status: string; notes: string } } = {}
        data.package.files.forEach((file: UploadedFile) => {
          initialVerifications[file.id] = {
            status: file.verification_status || '',
            notes: file.notes || ''
          }
        })
        setVerifications(initialVerifications)
      } else {
        error('Gagal mengambil detail paket')
      }
    } catch (err) {
      error('Gagal mengambil detail paket')
    }
  }

  const handleFileVerification = (fileId: string, status: string) => {
    setVerifications(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        status
      }
    }))
  }

  const handleNotesChange = (fileId: string, notes: string) => {
    setVerifications(prev => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        notes
      }
    }))
  }

  const saveVerification = async (fileId: string) => {
    const verification = verifications[fileId]
    if (!verification || !verification.status) {
      error('Pilih status verifikasi terlebih dahulu')
      return
    }

    try {
      const response = await fetch(`/api/verification/${fileId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status: verification.status,
          notes: verification.notes
        })
      })

      if (response.ok) {
        success('Verifikasi berhasil disimpan')
        // Update the file in selectedPackage
        if (selectedPackage) {
          const updatedFiles = selectedPackage.files.map(file => 
            file.id === fileId 
              ? { ...file, verification_status: verification.status, notes: verification.notes }
              : file
          )
          setSelectedPackage({ ...selectedPackage, files: updatedFiles })
        }
      } else {
        const data = await response.json()
        error('Gagal menyimpan verifikasi', data.error)
      }
    } catch (err) {
      error('Gagal menyimpan verifikasi')
    }
  }

  const completeVerification = async () => {
    if (!selectedPackage) return

    const unverifiedFiles = selectedPackage.files.filter(file => !verifications[file.id]?.status)
    if (unverifiedFiles.length > 0) {
      error('Semua file harus diverifikasi terlebih dahulu')
      return
    }

    setIsVerifying(true)
    try {
      const response = await fetch(`/api/packages/${selectedPackage.id}/verify`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        success('Verifikasi paket berhasil diselesaikan')
        setSelectedPackage(null)
        fetchPackages()
      } else {
        const data = await response.json()
        error('Gagal menyelesaikan verifikasi', data.error)
      }
    } catch (err) {
      error('Gagal menyelesaikan verifikasi')
    } finally {
      setIsVerifying(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100'
      case 'rejected':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Disetujui'
      case 'rejected':
        return 'Ditolak'
      default:
        return 'Belum Diverifikasi'
    }
  }

  const currentFile = selectedPackage?.files[currentFileIndex]

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Verifikasi Gambar</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{packages.length} paket menunggu verifikasi</span>
        </div>
      </div>

      {!selectedPackage ? (
        // Package List
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Package className="w-6 h-6 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900">{pkg.title}</h3>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(pkg.status)}`}>
                  {getStatusLabel(pkg.status)}
                </span>
              </div>

              {pkg.description && (
                <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
              )}

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex justify-between">
                  <span>Uploader:</span>
                  <span className="font-medium">{pkg.uploader_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Jumlah File:</span>
                  <span className="font-medium">{pkg.file_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Diverifikasi:</span>
                  <span className="font-medium">{pkg.verified_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span className="font-medium">
                    {new Date(pkg.created_at).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => fetchPackageDetails(pkg.id)}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <CheckSquare className="w-4 h-4" />
                <span>Verifikasi</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        // Verification Interface
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedPackage.title}</h3>
                <p className="text-gray-600">Uploader: {selectedPackage.uploader_name}</p>
              </div>
              <button
                onClick={() => setSelectedPackage(null)}
                className="btn-secondary"
              >
                Kembali
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="flex space-x-6">
              {/* File List */}
              <div className="w-1/3">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Daftar File</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedPackage.files.map((file, index) => (
                    <div
                      key={file.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        index === currentFileIndex
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setCurrentFileIndex(index)}
                    >
                      <div className="flex items-center space-x-3">
                        <Image
                          src={file.url}
                          alt={file.originalName}
                          width={40}
                          height={40}
                          className="w-10 h-10 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {file.originalName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {verifications[file.id]?.status ? getStatusLabel(verifications[file.id].status) : 'Belum Diverifikasi'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Image Viewer */}
              <div className="flex-1">
                {currentFile && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-900">{currentFile.originalName}</h4>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setImageScale(Math.max(0.5, imageScale - 0.25))}
                          className="p-2 text-gray-600 hover:text-gray-900"
                        >
                          <ZoomOut className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-gray-600">{Math.round(imageScale * 100)}%</span>
                        <button
                          onClick={() => setImageScale(Math.min(3, imageScale + 0.25))}
                          className="p-2 text-gray-600 hover:text-gray-900"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setImageScale(1)}
                          className="p-2 text-gray-600 hover:text-gray-900"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setShowImageViewer(true)}
                          className="p-2 text-gray-600 hover:text-gray-900"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="relative bg-gray-100 flex items-center justify-center" style={{ height: '400px' }}>
                        <Image
                          src={currentFile.url}
                          alt={currentFile.originalName}
                          width={400}
                          height={400}
                          className="max-w-full max-h-full object-contain"
                          style={{ transform: `scale(${imageScale})` }}
                        />
                      </div>
                    </div>

                    {/* Verification Controls */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Status Verifikasi
                        </label>
                        <div className="flex space-x-4">
                          <button
                            onClick={() => handleFileVerification(currentFile.id, 'approved')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                              verifications[currentFile.id]?.status === 'approved'
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-300 hover:border-green-300'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Sesuai</span>
                          </button>
                          <button
                            onClick={() => handleFileVerification(currentFile.id, 'rejected')}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg border ${
                              verifications[currentFile.id]?.status === 'rejected'
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-gray-300 hover:border-red-300'
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Tidak Sesuai</span>
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Catatan (Opsional)
                        </label>
                        <textarea
                          value={verifications[currentFile.id]?.notes || ''}
                          onChange={(e) => handleNotesChange(currentFile.id, e.target.value)}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Masukkan catatan verifikasi..."
                        />
                      </div>

                      <div className="flex justify-between">
                        <button
                          onClick={() => saveVerification(currentFile.id)}
                          className="btn-primary"
                        >
                          Simpan Verifikasi
                        </button>
                        <div className="flex space-x-2">
                          {currentFileIndex > 0 && (
                            <button
                              onClick={() => setCurrentFileIndex(currentFileIndex - 1)}
                              className="btn-secondary"
                            >
                              Sebelumnya
                            </button>
                          )}
                          {currentFileIndex < selectedPackage.files.length - 1 && (
                            <button
                              onClick={() => setCurrentFileIndex(currentFileIndex + 1)}
                              className="btn-primary"
                            >
                              Selanjutnya
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Complete Verification */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  {selectedPackage.files.filter(f => verifications[f.id]?.status).length} dari {selectedPackage.files.length} file telah diverifikasi
                </div>
                <button
                  onClick={completeVerification}
                  disabled={isVerifying || selectedPackage.files.some(f => !verifications[f.id]?.status)}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isVerifying ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckSquare className="w-4 h-4" />
                  )}
                  <span>Selesaikan Verifikasi</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Viewer Modal */}
      {showImageViewer && currentFile && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={() => setShowImageViewer(false)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
            >
              <XCircle className="w-8 h-8" />
            </button>
            <Image
              src={currentFile.url}
              alt={currentFile.originalName}
              width={800}
              height={600}
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </div>
  )
}