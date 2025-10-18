'use client'

import { useState, useCallback } from 'react'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import MainLayout from '@/components/layout/MainLayout'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from '@/components/Toast'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import Image from 'next/image'

interface UploadedImage {
  id: string
  originalName: string
  filename: string
  filePath: string
  fileSize: number
  mimeType: string
  url: string
}

export default function UploadPage() {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [packageTitle, setPackageTitle] = useState('')
  const [packageDescription, setPackageDescription] = useState('')
  const [isCreatingPackage, setIsCreatingPackage] = useState(false)
  const { toasts, removeToast, success, error } = useToast()

  const uploadImage = async (file: File): Promise<UploadedImage> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('Upload failed')
    }

    const result = await response.json()
    return result.file
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setIsUploading(true)
    const newImages: UploadedImage[] = []

    for (const file of acceptedFiles) {
      try {
        const uploadedImage = await uploadImage(file)
        newImages.push(uploadedImage)
        success(`${file.name} berhasil diupload`)
      } catch (uploadError) {
        console.error(`Error uploading ${file.name}:`, uploadError)
        error(`Gagal mengupload ${file.name}`)
      }
    }

    setUploadedImages(prev => [...prev, ...newImages])
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

  const removeImage = (id: string) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id))
  }

  const createPackage = async () => {
    if (uploadedImages.length === 0) {
      error('Tidak ada gambar yang diupload')
      return
    }

    setIsCreatingPackage(true)

    try {
      const response = await fetch('/api/packages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: packageTitle || `Paket ${new Date().toLocaleDateString('id-ID')}`,
          description: packageDescription,
          images: uploadedImages.map(img => ({
            filename: img.filename,
            originalName: img.originalName,
            filePath: img.filePath,
            fileSize: img.fileSize,
            mimeType: img.mimeType
          }))
        }),
      })

      if (response.ok) {
        success('Paket berhasil dibuat', 'Paket gambar Anda telah dikirim untuk verifikasi')
        setUploadedImages([])
        setPackageTitle('')
        setPackageDescription('')
      } else {
        const data = await response.json()
        error('Gagal membuat paket', data.error)
      }
    } catch (err) {
      error('Terjadi kesalahan saat membuat paket')
    } finally {
      setIsCreatingPackage(false)
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
    <ProtectedRoute allowedRoles={['UPLOADER']}>
      <MainLayout>
        <ToastContainer toasts={toasts} onClose={removeToast} />
        
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upload Gambar</h1>
            <p className="text-gray-600">Unggah gambar untuk dibuat paket verifikasi</p>
          </div>

          {/* Package Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informasi Paket</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Judul Paket (Opsional)
                </label>
                <input
                  type="text"
                  value={packageTitle}
                  onChange={(e) => setPackageTitle(e.target.value)}
                  placeholder="Masukkan judul paket..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Deskripsi (Opsional)
                </label>
                <textarea
                  value={packageDescription}
                  onChange={(e) => setPackageDescription(e.target.value)}
                  placeholder="Masukkan deskripsi paket..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          {/* Upload Zone */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Gambar</h2>
            
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragActive 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-gray-300 hover:border-primary-500'
              } ${isUploading ? 'opacity-50' : ''}`}
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
                    ? 'Mengupload gambar...'
                    : isDragActive
                    ? 'Lepaskan gambar di sini...'
                    : 'Drag & drop gambar di sini, atau klik untuk memilih'
                  }
                </div>
                <div className="text-sm text-gray-500">
                  Mendukung: PNG, JPG, JPEG, GIF, WEBP (Max 10MB per file)
                </div>
              </div>
            </div>
          </div>

          {/* Uploaded Images */}
          {uploadedImages.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Gambar yang Diupload ({uploadedImages.length})
                </h2>
                <button
                  onClick={createPackage}
                  disabled={isCreatingPackage}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                >
                  {isCreatingPackage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>Buat Paket</span>
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {uploadedImages.map((image) => (
                  <div key={image.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      <Image
                        src={image.url}
                        alt={image.originalName}
                        width={200}
                        height={200}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={() => removeImage(image.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {image.originalName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(image.fileSize)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {uploadedImages.length === 0 && !isUploading && (
            <div className="text-center py-12">
              <ImageIcon className="w-24 h-24 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Belum ada gambar yang diupload
              </h3>
              <p className="text-gray-500">
                Mulai dengan mengupload gambar untuk membuat paket verifikasi
              </p>
            </div>
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  )
}