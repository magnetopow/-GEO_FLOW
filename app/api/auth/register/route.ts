import { NextRequest, NextResponse } from 'next/server'
import { createUser, generateToken } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, email, password, role } = await request.json()

    if (!username || !email || !password || !role) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate role
    if (!['ADMIN', 'UPLOADER', 'VERIFIER'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const user = await createUser({ username, email, password, role })
    if (!user) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 409 }
      )
    }

    const token = generateToken(user)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}