'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, Map, FileText, Camera, X, Eye, Download, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { useToast } from '@/hooks/useToast'
import { ToastContainer } from './Toast'
import { UPLOAD_CONFIG, getFileType, formatFileSize, validateFile } from '@/lib/upload-config'

interface UploadedFile {
  id: string
  originalName: string
  filename: string
  size: number
  type: 'map' | 'pdf' | 'screenshot'
  url: string
  uploadDate: string
}

interface FileUploadProps {
  onFilesUploaded?: (files: UploadedFile[]) => void
}

export default function FileUpload({ onFilesUploaded }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({})
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
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        invalidFiles.push({ file, error: validation.error! })
      }
    }

    // Show errors for invalid files
    invalidFiles.forEach(({ file, error }) => {
      error(`File ${file.name} tidak valid`, error)
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
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error)
        error(`Gagal mengupload ${file.name}`, 'Silakan coba lagi')
      }
    }

    setUploadedFiles(prev => [...prev, ...newFiles])
    setIsUploading(false)
    
    if (onFilesUploaded) {
      onFilesUploaded([...uploadedFiles, ...newFiles])
    }
  }, [uploadedFiles, onFilesUploaded, success, error])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
      'application/pdf': ['.pdf']
    },
    multiple: true,
    disabled: isUploading,
    maxFiles: UPLOAD_CONFIG.maxFiles,
    maxSize: UPLOAD_CONFIG.maxFileSize
  })

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'map': return <Map className="w-8 h-8 text-green-600" />
      case 'pdf': return <FileText className="w-8 h-8 text-red-600" />
      case 'screenshot': return <Camera className="w-8 h-8 text-blue-600" />
      default: return <FileText className="w-8 h-8 text-gray-600" />
    }
  }


  const removeFile = (id: string) => {
    const file = uploadedFiles.find(f => f.id === id)
    setUploadedFiles(prev => prev.filter(file => file.id !== id))
    if (file) {
      success(`${file.originalName} berhasil dihapus`)
    }
  }

  const downloadFile = (file: UploadedFile) => {
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.originalName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getFilePreview = (file: UploadedFile) => {
    if (file.type === 'pdf') {
      return (
        <div className="w-full h-32 bg-red-50 flex items-center justify-center rounded-lg">
          <FileText className="w-12 h-12 text-red-400" />
        </div>
      )
    }
    
    return (
      <Image
        src={file.url}
        alt={file.originalName}
        width={200}
        height={150}
        className="w-full h-32 object-cover rounded-lg"
      />
    )
  }

  return (
    <div className="w-full">
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
      
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
                : 'Drag & drop file di sini, atau klik untuk memilih'
              }
            </div>
            <div className="text-sm text-gray-500">
              Mendukung: PNG, JPG, PDF (Max {formatFileSize(UPLOAD_CONFIG.maxFileSize)} per file)
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
                    {getFileIcon(file.type)}
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
                  {getFilePreview(file)}
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
                    onClick={() => downloadFile(file)}
                    className="flex-1 btn-secondary flex items-center justify-center space-x-1"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  <button 
                    onClick={() => window.open(file.url, '_blank')}
                    className="btn-primary flex items-center justify-center space-x-1"
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
            Mulai dengan mengupload file peta, PDF, atau screenshot Anda
          </p>
        </div>
      )}
    </div>
  )
}