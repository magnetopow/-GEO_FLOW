import { NextRequest, NextResponse } from 'next/server'
import { authHelpers } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, role } = await request.json()

    if (!username || !email || !password || !role) {
      return NextResponse.json({ error: 'Semua field harus diisi' }, { status: 400 })
    }

    if (!['admin', 'uploader', 'verifikator'].includes(role)) {
      return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 })
    }

    const result = await authHelpers.register({
      username,
      email,
      password,
      role
    })
    
    if (result.success) {
      return NextResponse.json({
        message: 'Registrasi berhasil',
        user: result.user,
        token: result.token
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat registrasi' },
      { status: 500 }
    )
  }
}