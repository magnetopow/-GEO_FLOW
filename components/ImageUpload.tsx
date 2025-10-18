'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Eye, Loader2, CheckCircle, XCircle } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from './Toast'

interface ImageFile {
  id: string
  file: File
  preview: string
  status: 'uploading' | 'uploaded' | 'error'
  uploadedImage?: {
    id: string
    originalName: string
    filename: string
    filePath: string
    size: number
    mimeType: string
    status: string
  }
}

interface ImageUploadProps {
  packageId: string
  onImagesUploaded?: (images: any[]) => void
  onClose?: () => void
}

export default function ImageUpload({ packageId, onImagesUploaded, onClose }: ImageUploadProps) {
  const [images, setImages] = useState<ImageFile[]>([])
  const [isUploading, setUploading] = useState(false)
  const { toasts, removeToast, success, error } = useToast()

  const uploadImages = async (files: File[]) => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })

    try {
      const response = await fetch(`/api/packages/${packageId}/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload gagal')
      }

      const result = await response.json()
      return result.images
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    // Create image objects with previews
    const newImages: ImageFile[] = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      status: 'uploading' as const,
    }))

    setImages(prev => [...prev, ...newImages])
    setUploading(true)

    try {
      const uploadedImages = await uploadImages(acceptedFiles)
      
      // Update image status
      setImages(prev => prev.map(img => {
        if (img.status === 'uploading') {
          const uploadedImg = uploadedImages.find(uploaded => 
            uploaded.originalName === img.file.name
          )
          return {
            ...img,
            status: uploadedImg ? 'uploaded' : 'error',
            uploadedImage: uploadedImg,
          }
        }
        return img
      }))

      success(`${uploadedImages.length} gambar berhasil diupload!`)
      
      if (onImagesUploaded) {
        onImagesUploaded(uploadedImages)
      }
    } catch (uploadError) {
      console.error('Upload error:', uploadError)
      
      // Mark all uploading images as error
      setImages(prev => prev.map(img => 
        img.status === 'uploading' ? { ...img, status: 'error' } : img
      ))
      
      error('Gagal mengupload gambar', 'Silakan coba lagi')
    } finally {
      setUploading(false)
    }
  }, [packageId, success, error, onImagesUploaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: true,
    disabled: isUploading,
    maxFiles: 20,
    maxSize: 10 * 1024 * 1024, // 10MB
  })

  const removeImage = (id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id)
      if (image?.preview) {
        URL.revokeObjectURL(image.preview)
      }
      return prev.filter(img => img.id !== id)
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
      case 'uploaded':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'uploading':
        return 'Mengupload...'
      case 'uploaded':
        return 'Berhasil'
      case 'error':
        return 'Gagal'
      default:
        return ''
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-2/3 shadow-lg rounded-md bg-white">
        <div className="mt-3">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Upload Gambar</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Toast Container */}
          <ToastContainer toasts={toasts} onClose={removeToast} />

          {/* Upload Zone */}
          <div className="mb-6">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {isUploading
                  ? 'Mengupload gambar...'
                  : isDragActive
                  ? 'Lepaskan gambar di sini...'
                  : 'Drag & drop gambar di sini, atau klik untuk memilih'
                }
              </p>
              <p className="text-sm text-gray-500">
                Mendukung: PNG, JPG, JPEG, GIF, WEBP (Max 10MB per file)
              </p>
            </div>
          </div>

          {/* Image List */}
          {images.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-md font-medium text-gray-900">
                Gambar yang Diupload ({images.length})
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {images.map((image) => (
                  <div key={image.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(image.status)}
                        <span className="text-sm font-medium text-gray-900">
                          {getStatusText(image.status)}
                        </span>
                      </div>
                      <button
                        onClick={() => removeImage(image.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mb-2">
                      <Image
                        src={image.preview}
                        alt={image.file.name}
                        width={200}
                        height={150}
                        className="w-full h-32 object-cover rounded"
                      />
                    </div>

                    <div className="text-xs text-gray-500 space-y-1">
                      <p className="truncate">{image.file.name}</p>
                      <p>{formatFileSize(image.file.size)}</p>
                    </div>

                    {image.uploadedImage && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Berhasil diupload
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Tutup
            </button>
            {images.length > 0 && (
              <button
                onClick={() => {
                  onImagesUploaded?.(images.filter(img => img.uploadedImage).map(img => img.uploadedImage!))
                  onClose?.()
                }}
                className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Selesai
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}