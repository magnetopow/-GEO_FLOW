import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/database'

async function handler(request: NextRequest, user: any) {
  if (request.method === 'GET') {
    try {
      let packages = []
      
      if (user.role === 'ADMIN') {
        packages = db.getAllPackages()
      } else if (user.role === 'UPLOADER') {
        packages = db.getPackagesByUser(user.id)
      } else if (user.role === 'VERIFIER') {
        packages = db.getPackagesByStatus('PENDING')
      }

      return NextResponse.json({
        success: true,
        packages: packages.map(pkg => ({
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          uploadedBy: pkg.uploadedBy,
          uploadedAt: pkg.uploadedAt,
          verifiedAt: pkg.verifiedAt,
          verifiedBy: pkg.verifiedBy,
          status: pkg.status,
          imageCount: pkg.images.length,
          compiledAt: pkg.compiledAt,
          compiledBy: pkg.compiledBy,
        })),
      })
    } catch (error) {
      console.error('Get packages error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  if (request.method === 'POST') {
    try {
      const { name, description } = await request.json()

      if (!name) {
        return NextResponse.json(
          { error: 'Package name is required' },
          { status: 400 }
        )
      }

      if (user.role !== 'UPLOADER' && user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Only uploaders can create packages' },
          { status: 403 }
        )
      }

      const newPackage = db.createPackage({
        name,
        description,
        uploadedBy: user.id,
        status: 'PENDING',
      })

      return NextResponse.json({
        success: true,
        package: {
          id: newPackage.id,
          name: newPackage.name,
          description: newPackage.description,
          uploadedBy: newPackage.uploadedBy,
          uploadedAt: newPackage.uploadedAt,
          status: newPackage.status,
          imageCount: newPackage.images.length,
        },
      })
    } catch (error) {
      console.error('Create package error:', error)
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

export const GET = requireAuth(handler)
export const POST = requireAuth(handler)