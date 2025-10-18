import { NextRequest, NextResponse } from 'next/server'
import { authHelpers } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email dan password harus diisi' }, { status: 400 })
    }

    const result = await authHelpers.login(email, password)
    
    if (result.success) {
      return NextResponse.json({
        message: 'Login berhasil',
        user: result.user,
        token: result.token
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat login' },
      { status: 500 }
    )
  }
}