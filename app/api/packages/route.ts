import { NextRequest, NextResponse } from 'next/server'
import { authHelpers } from '@/lib/auth'
import { dbHelpers } from '@/lib/database'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = authHelpers.getUserFromToken(token)
    
    if (!user || user.role !== 'uploader') {
      return NextResponse.json({ error: 'Akses ditolak. Hanya uploader yang dapat membuat paket' }, { status: 403 })
    }

    const { title, description, files } = await request.json()

    if (!title || !files || files.length === 0) {
      return NextResponse.json({ error: 'Judul dan file harus diisi' }, { status: 400 })
    }

    // Create package
    const packageId = uuidv4()
    dbHelpers.createDocumentPackage({
      id: packageId,
      uploaderId: user.id,
      title,
      description
    })

    // Create uploaded files
    for (const file of files) {
      dbHelpers.createUploadedFile({
        id: file.id,
        packageId,
        originalName: file.originalName,
        filename: file.filename,
        filePath: file.filePath,
        fileSize: file.fileSize,
        fileType: file.fileType,
        mimeType: file.mimeType
      })
    }

    // Get created package with files
    const packageData = dbHelpers.getDocumentPackage(packageId)
    const packageFiles = dbHelpers.getFilesByPackage(packageId)

    return NextResponse.json({
      message: 'Paket dokumen berhasil dibuat',
      package: {
        ...packageData,
        files: packageFiles
      }
    })
  } catch (error) {
    console.error('Error creating package:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membuat paket' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = authHelpers.getUserFromToken(token)
    
    if (!user) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })
    }

    let packages

    if (user.role === 'uploader') {
      // Get packages by uploader
      packages = dbHelpers.getDocumentPackagesByUploader(user.id)
    } else if (user.role === 'verifikator') {
      // Get pending packages for verification
      packages = dbHelpers.getPendingPackages()
    } else if (user.role === 'admin') {
      // Get all packages
      packages = dbHelpers.getDocumentPackagesByUploader(user.id) // This needs to be updated to get all packages
    } else {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    return NextResponse.json({ packages })
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil data paket' },
      { status: 500 }
    )
  }
}