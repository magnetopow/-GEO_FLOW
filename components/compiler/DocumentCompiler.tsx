'use client'

import React, { useState, useEffect } from 'react'
import { useToast } from '@/hooks/useToast'
import { FileText, Download, Printer, CheckSquare, Package, Eye } from 'lucide-react'
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

interface DocumentCompilerProps {
  token: string
}

export default function DocumentCompiler({ token }: DocumentCompilerProps) {
  const [packages, setPackages] = useState<DocumentPackage[]>([])
  const [selectedPackage, setSelectedPackage] = useState<DocumentPackage | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCompiling, setIsCompiling] = useState(false)
  const [compiledDocuments, setCompiledDocuments] = useState<any[]>([])
  
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
        
        // Auto-select approved files
        const approvedFiles = data.package.files
          .filter((file: UploadedFile) => file.verification_status === 'approved')
          .map((file: UploadedFile) => file.id)
        setSelectedFiles(approvedFiles)
      } else {
        error('Gagal mengambil detail paket')
      }
    } catch (err) {
      error('Gagal mengambil detail paket')
    }
  }

  const fetchCompiledDocuments = async (packageId: string) => {
    try {
      const response = await fetch(`/api/compiled-documents/${packageId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCompiledDocuments(data.documents)
      }
    } catch (err) {
      console.error('Error fetching compiled documents:', err)
    }
  }

  const handleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => 
      prev.includes(fileId) 
        ? prev.filter(id => id !== fileId)
        : [...prev, fileId]
    )
  }

  const selectAllApproved = () => {
    if (!selectedPackage) return
    
    const approvedFiles = selectedPackage.files
      .filter(file => file.verification_status === 'approved')
      .map(file => file.id)
    setSelectedFiles(approvedFiles)
  }

  const deselectAll = () => {
    setSelectedFiles([])
  }

  const compileDocument = async () => {
    if (!selectedPackage || selectedFiles.length === 0) {
      error('Pilih minimal satu file untuk dikompilasi')
      return
    }

    setIsCompiling(true)
    try {
      const response = await fetch('/api/compile-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          packageId: selectedPackage.id,
          fileIds: selectedFiles,
          title: selectedPackage.title
        })
      })

      if (response.ok) {
        const data = await response.json()
        success('Dokumen berhasil dikompilasi!')
        fetchCompiledDocuments(selectedPackage.id)
      } else {
        const errorData = await response.json()
        error('Gagal mengompilasi dokumen', errorData.error)
      }
    } catch (err) {
      error('Gagal mengompilasi dokumen')
    } finally {
      setIsCompiling(false)
    }
  }

  const downloadDocument = (documentId: string) => {
    const link = document.createElement('a')
    link.href = `/api/compiled-documents/${documentId}/download`
    link.download = `compiled-document-${documentId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const printDocument = (documentId: string) => {
    window.open(`/api/compiled-documents/${documentId}/print`, '_blank')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'text-green-600 bg-green-100'
      case 'rejected':
        return 'text-red-600 bg-red-100'
      case 'completed':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified':
        return 'Terverifikasi'
      case 'rejected':
        return 'Ditolak'
      case 'completed':
        return 'Selesai'
      default:
        return 'Menunggu'
    }
  }

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
        <h2 className="text-2xl font-bold text-gray-900">Kompilasi Dokumen</h2>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Package className="w-4 h-4" />
          <span>{packages.filter(p => p.status === 'verified').length} paket siap dikompilasi</span>
        </div>
      </div>

      {!selectedPackage ? (
        // Package List
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.filter(pkg => pkg.status === 'verified').map((pkg) => (
            <div key={pkg.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <FileText className="w-6 h-6 text-blue-600" />
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
                  <span>Total File:</span>
                  <span className="font-medium">{pkg.file_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Disetujui:</span>
                  <span className="font-medium text-green-600">{pkg.verified_count}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span className="font-medium">
                    {new Date(pkg.created_at).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  fetchPackageDetails(pkg.id)
                  fetchCompiledDocuments(pkg.id)
                }}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <FileText className="w-4 h-4" />
                <span>Kompilasi</span>
              </button>
            </div>
          ))}
        </div>
      ) : (
        // Compilation Interface
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">{selectedPackage.title}</h3>
                <p className="text-gray-600">Uploader: {selectedPackage.uploader_name}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedPackage(null)
                  setSelectedFiles([])
                  setCompiledDocuments([])
                }}
                className="btn-secondary"
              >
                Kembali
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* File Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-medium text-gray-900">Pilih File untuk Dikompilasi</h4>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAllApproved}
                      className="text-sm text-primary-600 hover:text-primary-700"
                    >
                      Pilih Semua Disetujui
                    </button>
                    <button
                      onClick={deselectAll}
                      className="text-sm text-gray-600 hover:text-gray-700"
                    >
                      Batal Pilih
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {selectedPackage.files.map((file) => (
                    <div
                      key={file.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedFiles.includes(file.id)
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleFileSelection(file.id)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={selectedFiles.includes(file.id)}
                            onChange={() => handleFileSelection(file.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </div>
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
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              file.verification_status === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : file.verification_status === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {file.verification_status === 'approved' ? 'Disetujui' : 
                               file.verification_status === 'rejected' ? 'Ditolak' : 'Belum Diverifikasi'}
                            </span>
                            {file.verifier_name && (
                              <span className="text-xs text-gray-500">
                                by {file.verifier_name}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <button
                    onClick={compileDocument}
                    disabled={isCompiling || selectedFiles.length === 0}
                    className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCompiling ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    <span>Kompilasi Dokumen PDF</span>
                  </button>
                </div>
              </div>

              {/* Compiled Documents */}
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-4">Dokumen Terkompilasi</h4>
                
                {compiledDocuments.length > 0 ? (
                  <div className="space-y-3">
                    {compiledDocuments.map((doc) => (
                      <div key={doc.id} className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="text-sm font-medium text-gray-900">{doc.filename}</h5>
                            <p className="text-xs text-gray-500">
                              Dibuat oleh {doc.created_by_name} • {new Date(doc.created_at).toLocaleDateString('id-ID')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(doc.file_size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => downloadDocument(doc.id)}
                              className="p-2 text-gray-600 hover:text-gray-900"
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => printDocument(doc.id)}
                              className="p-2 text-gray-600 hover:text-gray-900"
                              title="Print"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>Belum ada dokumen terkompilasi</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}