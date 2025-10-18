import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/database'

async function handler(
  request: NextRequest,
  { params }: { params: { id: string } },
  user: any
) {
  const userId = params.id

  if (request.method === 'GET') {
    try {
      const user = db.getUserById(userId)
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      })
    } catch (error) {
      console.error('Get user error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  if (request.method === 'PUT') {
    try {
      const { username, email, role } = await request.json()

      const existingUser = db.getUserById(userId)
      if (!existingUser) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Check if email or username is already taken by another user
      if (email && email !== existingUser.email) {
        const emailExists = db.getUserByEmail(email)
        if (emailExists) {
          return NextResponse.json(
            { error: 'Email already taken' },
            { status: 409 }
          )
        }
      }

      if (username && username !== existingUser.username) {
        const usernameExists = db.getUserByUsername(username)
        if (usernameExists) {
          return NextResponse.json(
            { error: 'Username already taken' },
            { status: 409 }
          )
        }
      }

      // Validate role
      if (role && !['ADMIN', 'UPLOADER', 'VERIFIER'].includes(role)) {
        return NextResponse.json(
          { error: 'Invalid role' },
          { status: 400 }
        )
      }

      const updatedUser = db.updateUser(userId, {
        username,
        email,
        role,
      })

      if (!updatedUser) {
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          role: updatedUser.role,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        },
      })
    } catch (error) {
      console.error('Update user error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  if (request.method === 'DELETE') {
    try {
      const user = db.getUserById(userId)
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      // Prevent deleting admin users
      if (user.role === 'ADMIN') {
        return NextResponse.json(
          { error: 'Cannot delete admin users' },
          { status: 403 }
        )
      }

      const deleted = db.deleteUser(userId)
      if (!deleted) {
        return NextResponse.json(
          { error: 'Failed to delete user' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'User deleted successfully',
      })
    } catch (error) {
      console.error('Delete user error:', error)
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
export const PUT = requireRole(['ADMIN'])(handler)
export const DELETE = requireRole(['ADMIN'])(handler)