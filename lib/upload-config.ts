export const UPLOAD_CONFIG = {
  maxFileSize: parseInt(process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '10485760'), // 10MB
  allowedTypes: (process.env.NEXT_PUBLIC_ALLOWED_FILE_TYPES || 'image/*,application/pdf').split(','),
  maxFiles: 10,
  uploadPath: 'uploads'
} as const

export const FILE_TYPES = {
  IMAGE: 'image',
  PDF: 'application/pdf',
  MAP: 'map',
  SCREENSHOT: 'screenshot'
} as const

export function getFileType(file: File): 'map' | 'pdf' | 'screenshot' {
  if (file.type === FILE_TYPES.PDF) return 'pdf'
  if (file.type.startsWith(FILE_TYPES.IMAGE)) {
    // Simple heuristic for map detection
    return file.name.toLowerCase().includes('map') ? 'map' : 'screenshot'
  }
  return 'screenshot'
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > UPLOAD_CONFIG.maxFileSize) {
    return {
      valid: false,
      error: `File terlalu besar. Maksimal ${formatFileSize(UPLOAD_CONFIG.maxFileSize)}`
    }
  }

  // Check file type
  const isValidType = UPLOAD_CONFIG.allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.slice(0, -1))
    }
    return file.type === type
  })

  if (!isValidType) {
    return {
      valid: false,
      error: 'Tipe file tidak didukung. Hanya gambar dan PDF yang diperbolehkan'
    }
  }

  return { valid: true }
}