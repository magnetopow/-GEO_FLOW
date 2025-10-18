import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/database'

async function handler(request: NextRequest, user: any) {
  if (request.method === 'GET') {
    try {
      const users = db.getAllUsers()
      return NextResponse.json({
        success: true,
        users: users.map(u => ({
          id: u.id,
          username: u.username,
          email: u.email,
          role: u.role,
          createdAt: u.createdAt,
          updatedAt: u.updatedAt,
        })),
      })
    } catch (error) {
      console.error('Get users error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  if (request.method === 'POST') {
    try {
      const { username, email, password, role } = await request.json()

      if (!username || !email || !password || !role) {
        return NextResponse.json(
          { error: 'All fields are required' },
          { status: 400 }
        )
      }

      // Validate role
      if (!['UPLOADER', 'VERIFIER'].includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role. Only UPLOADER and VERIFIER can be created' },
          { status: 400 }
        )
      }

      // Check if user already exists
      if (db.getUserByEmail(email) || db.getUserByUsername(username)) {
        return NextResponse.json(
          { error: 'User already exists' },
          { status: 409 }
        )
      }

      const newUser = db.createUser({
        username,
        email,
        password,
        role,
      })

      return NextResponse.json({
        success: true,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          createdAt: newUser.createdAt,
        },
      })
    } catch (error) {
      console.error('Create user error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

export const GET = requireRole(['ADMIN'])(handler)
export const POST = requireRole(['ADMIN'])(handler)