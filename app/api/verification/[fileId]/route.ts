import { NextRequest, NextResponse } from 'next/server'
import { authHelpers } from '@/lib/auth'
import { dbHelpers } from '@/lib/database'
import { v4 as uuidv4 } from 'uuid'

export async function POST(
  request: NextRequest,
  { params }: { params: { fileId: string } }
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
      return NextResponse.json({ error: 'Akses ditolak. Hanya verifikator yang dapat melakukan verifikasi' }, { status: 403 })
    }

    const { status, notes } = await request.json()
    const fileId = params.fileId

    if (!status || !['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status verifikasi tidak valid' }, { status: 400 })
    }

    // Check if verification already exists
    const existingVerification = dbHelpers.getFileVerification(fileId, user.id)
    
    if (existingVerification) {
      // Update existing verification
      dbHelpers.updateFileVerification(fileId, user.id, status, notes)
    } else {
      // Create new verification
      dbHelpers.createFileVerification({
        id: uuidv4(),
        fileId,
        verifierId: user.id,
        status,
        notes
      })
    }

    return NextResponse.json({ message: 'Verifikasi berhasil disimpan' })
  } catch (error) {
    console.error('Error saving verification:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menyimpan verifikasi' },
      { status: 500 }
    )
  }
}