import { NextRequest, NextResponse } from 'next/server'
import { authHelpers } from '@/lib/auth'
import { dbHelpers } from '@/lib/database'

export async function GET(
  request: NextRequest,
  { params }: { params: { packageId: string } }
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

    const packageId = params.packageId
    const documents = dbHelpers.getCompiledDocuments(packageId)

    return NextResponse.json({ documents })
  } catch (error) {
    console.error('Error fetching compiled documents:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengambil dokumen terkompilasi' },
      { status: 500 }
    )
  }
}