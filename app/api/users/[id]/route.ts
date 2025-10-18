import { NextRequest, NextResponse } from 'next/server'
import { authHelpers } from '@/lib/auth'
import { dbHelpers } from '@/lib/database'

export async function PUT(
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
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const userId = parseInt(params.id)
    const { username, email, password, role } = await request.json()

    // Validate input
    if (!username || !email || !role) {
      return NextResponse.json({ error: 'Username, email, dan role harus diisi' }, { status: 400 })
    }

    if (!['admin', 'uploader', 'verifikator'].includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })
    }

    // Check if user exists
    const existingUser = dbHelpers.getUserById(userId)
    if (!existingUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
    }

    // Check if email is taken by another user
    const userWithEmail = dbHelpers.getUserByEmail(email)
    if (userWithEmail && userWithEmail.id !== userId) {
      return NextResponse.json({ error: 'Email sudah digunakan oleh pengguna lain' }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = { username, email, role }
    
    // Only update password if provided
    if (password && password.trim() !== '') {
      updateData.password = await authHelpers.hashPassword(password)
    }

    // Update user
    dbHelpers.updateUser(userId, updateData)

    return NextResponse.json({ message: 'Pengguna berhasil diperbarui' })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memperbarui pengguna' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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
    
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const userId = parseInt(params.id)

    // Check if user exists
    const existingUser = dbHelpers.getUserById(userId)
    if (!existingUser) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 })
    }

    // Prevent admin from deleting themselves
    if (userId === user.id) {
      return NextResponse.json({ error: 'Tidak dapat menghapus akun sendiri' }, { status: 400 })
    }

    // Delete user
    dbHelpers.deleteUser(userId)

    return NextResponse.json({ message: 'Pengguna berhasil dihapus' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menghapus pengguna' },
      { status: 500 }
    )
  }
}