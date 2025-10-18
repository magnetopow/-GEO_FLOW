'use client'

import React, { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Image as ImageIcon, X, Eye, Package, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '../Toast'

interface UploadedFile {
  id: string
  originalName: string
  filename: string
  size: number
  type: string
  url: string
  uploadDate: string
}

interface DocumentPackage {
  id: string
  title: string
  description?: string
  status: 'pending' | 'verified' | 'rejected' | 'completed'
  files: UploadedFile[]
  created_at: string
}

interface ImageUploaderProps {
  token: string
  onPackageCreated?: (package: DocumentPackage) => void
}

export default function ImageUploader({ token, onPackageCreated }: ImageUploaderProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
  const [packageTitle, setPackageTitle] = useState('')
  const [packageDescription, setPackageDescription] = useState('')
  const [showPackageForm, setShowPackageForm] = useState(false)
  
  const { toasts, removeToast, success, error } = useToast()

  const uploadFile = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload gagal')
      }

      const result = await response.json()
      return result.file
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Validate files first
    const validFiles: File[] = []
    const invalidFiles: { file: File; error: string }[] = []

    for (const file of acceptedFiles) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        invalidFiles.push({ file, error: 'Hanya file gambar yang diperbolehkan' })
        continue
      }

      // Check file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        invalidFiles.push({ file, error: 'File terlalu besar. Maksimal 10MB' })
        continue
      }

      validFiles.push(file)
    }

    // Show errors for invalid files
    invalidFiles.forEach(({ file, error: errorMessage }) => {
      error(`File ${file.name} tidak valid`, errorMessage)
    })

    if (validFiles.length === 0) {
      return
    }

    setIsUploading(true)
    const newFiles: UploadedFile[] = []

    for (const file of validFiles) {
      try {
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))
        
        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress(prev => ({
            ...prev,
            [file.name]: Math.min(prev[file.name] + 10, 90)
          }))
        }, 100)

        const uploadedFile = await uploadFile(file)
        newFiles.push(uploadedFile)
        
        clearInterval(progressInterval)
        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }))
        
        success(`${file.name} berhasil diupload!`)
        
        // Remove progress after a delay
        setTimeout(() => {
          setUploadProgress(prev => {
            const newProgress = { ...prev }
            delete newProgress[file.name]
            return newProgress
          })
        }, 1000)
      } catch (uploadError) {
        console.error(`Error uploading ${file.name}:`, uploadError)
        error(`Gagal mengupload ${file.name}`, 'Silakan coba lagi')
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles])
    setIsUploading(false)
  }, [success, error])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: true,
    disabled: isUploading,
    maxFiles: 20,
    maxSize: 10 * 1024 * 1024 // 10MB
  })

  const removeFile = (id: string) => {
    const file = uploadedFiles.find(f => f.id === id)
    setUploadedFiles(prev => prev.filter(file => file.id !== id))
    if (file) {
      success(`${file.originalName} berhasil dihapus`)
    }
  }

  const createPackage = async () => {
    if (!packageTitle.trim()) {
      error('Judul paket harus diisi')
      return
    }

    if (uploadedFiles.length === 0) {
      error('Minimal satu file harus diupload')
      return
    }

    try {
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: packageTitle,
          description: packageDescription,
          files: uploadedFiles.map(file => ({
            id: file.id,
            originalName: file.originalName,
            filename: file.filename,
            filePath: file.url,
            fileSize: file.size,
            fileType: 'image',
            mimeType: file.type
          }))
        })
      })

      if (response.ok) {
        const result = await response.json()
        success('Paket dokumen berhasil dibuat!')
        setUploadedFiles([])
        setPackageTitle('')
        setPackageDescription('')
        setShowPackageForm(false)
        onPackageCreated?.(result.package)
      } else {
        const data = await response.json()
        error('Gagal membuat paket', data.error)
      }
    } catch (err) {
      error('Gagal membuat paket', 'Terjadi kesalahan saat membuat paket')
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="w-full">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
      {/* Package Form */}
      {uploadedFiles.length > 0 && !showPackageForm && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-blue-900">
                  {uploadedFiles.length} file siap untuk dibuat paket
                </h3>
                <p className="text-blue-700">
                  Klik tombol di bawah untuk membuat paket dokumen
                </p>
              </div>
              <button
                onClick={() => setShowPackageForm(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Package className="w-5 h-5" />
                <span>Buat Paket</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package Creation Form */}
      {showPackageForm && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Buat Paket Dokumen</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Paket *
                </label>
                <input
                  type="text"
                  value={packageTitle}
                  onChange={(e) => setPackageTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Masukkan judul paket dokumen"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  value={packageDescription}
                  onChange={(e) => setPackageDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Masukkan deskripsi paket dokumen"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowPackageForm(false)}
                  className="btn-secondary"
                >
                  Batal
                </button>
                <button
                  onClick={createPackage}
                  className="btn-primary"
                >
                  Buat Paket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      <div className="max-w-4xl mx-auto mb-8">
        <div
          {...getRootProps()}
          className={`upload-zone ${isDragActive ? 'active' : ''} ${isUploading ? 'opacity-50' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            {isUploading ? (
              <Loader2 className="w-16 h-16 text-primary-500 animate-spin" />
            ) : (
              <Upload className="w-16 h-16 text-gray-400" />
            )}
            <div className="text-lg font-medium text-gray-700">
              {isUploading
                ? 'Mengupload file...'
                : isDragActive
                ? 'Lepaskan file di sini...'
                : 'Drag & drop gambar di sini, atau klik untuk memilih'
              }
            </div>
            <div className="text-sm text-gray-500">
              Mendukung: PNG, JPG, JPEG, GIF, WEBP (Max 10MB per file)
            </div>
          </div>
        </div>
      </div>

      {/* Upload Progress */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="max-w-4xl mx-auto mb-6">
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="mb-2">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>{filename}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-semibold text-gray-900 mb-6">
            File yang Diupload ({uploadedFiles.length})
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="file-card">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <ImageIcon className="w-8 h-8 text-blue-600" />
                    <div>
                      <div className="font-medium text-gray-900 truncate max-w-48">
                        {file.originalName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(file.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Preview */}
                <div className="mb-3">
                  <Image
                    src={file.url}
                    alt={file.originalName}
                    width={200}
                    height={150}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>

                {/* File Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Tipe:</span>
                    <span className="font-medium capitalize">{file.type}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Tanggal:</span>
                    <span className="font-medium">
                      {new Date(file.uploadDate).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 mt-4">
                  <button 
                    onClick={() => window.open(file.url, '_blank')}
                    className="flex-1 btn-primary flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-4 h-4" />
                    <span>Lihat</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {uploadedFiles.length === 0 && !isUploading && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Upload className="w-24 h-24 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Belum ada file yang diupload
          </h3>
          <p className="text-gray-500">
            Mulai dengan mengupload gambar untuk membuat paket dokumen
          </p>
        </div>
      )}
    </div>
  )
}