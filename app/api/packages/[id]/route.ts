import { NextRequest, NextResponse } from 'next/server'
import { authHelpers } from '@/lib/auth'
import { dbHelpers } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const packageId = params.id
    const packageData = dbHelpers.getDocumentPackage(packageId)
    
    if (!packageData) {
      return NextResponse.json({ error: 'Paket tidak ditemukan' }, { status: 404 })
    }

    // Check access permissions
    if (user.role === 'uploader' && packageData.uploader_id !== user.id) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    // Get files for the package
    const files = dbHelpers.getFilesByPackage(packageId)

    return NextResponse.json({
      package: {
        ...packageData,
        files
      }
    })
  } catch (error) {
    console.error('Error fetching package details:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil detail paket' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = authHelpers.getUserFromToken(token)
    
    if (!user || user.role !== 'verifikator') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const packageId = params.id
    const { action } = await request.json()

    if (action === 'verify') {
      // Update package status to verified
      dbHelpers.updatePackageStatus(packageId, 'verified')
      return NextResponse.json({ message: 'Paket berhasil diverifikasi' })
    }

    return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 })
  } catch (error) {
    console.error('Error updating package:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memperbarui paket' },
      { status: 500 }
    )
  }
}