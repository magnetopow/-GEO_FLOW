import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/database'

async function handler(
  request: NextRequest,
  { params }: { params: { id: string } },
  user: any
) {
  const packageId = params.id

  if (request.method === 'GET') {
    try {
      const pkg = db.getPackageById(packageId)
      if (!pkg) {
        return NextResponse.json(
          { error: 'Package not found' },
          { status: 404 }
        )
      }

      // Check permissions
      if (user.role !== 'ADMIN' && pkg.uploadedBy !== user.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

      return NextResponse.json({
        success: true,
        package: {
          id: pkg.id,
          name: pkg.name,
          description: pkg.description,
          uploadedBy: pkg.uploadedBy,
          uploadedAt: pkg.uploadedAt,
          verifiedAt: pkg.verifiedAt,
          verifiedBy: pkg.verifiedBy,
          status: pkg.status,
          images: pkg.images.map(img => ({
            id: img.id,
            originalName: img.originalName,
            filename: img.filename,
            filePath: img.filePath,
            size: img.size,
            mimeType: img.mimeType,
            uploadedBy: img.uploadedBy,
            uploadedAt: img.uploadedAt,
            verifiedAt: img.verifiedAt,
            verifiedBy: img.verifiedBy,
            status: img.status,
            verificationNotes: img.verificationNotes,
          })),
          compiledAt: pkg.compiledAt,
          compiledBy: pkg.compiledBy,
          compiledDocumentPath: pkg.compiledDocumentPath,
        },
      })
    } catch (error) {
      console.error('Get package error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  if (request.method === 'PUT') {
    try {
      const { name, description, status } = await request.json()

      const pkg = db.getPackageById(packageId)
      if (!pkg) {
        return NextResponse.json(
          { error: 'Package not found' },
          { status: 404 }
        )
      }

      // Check permissions
      if (user.role !== 'ADMIN' && pkg.uploadedBy !== user.id) {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

      const updatedPackage = db.updatePackage(packageId, {
        name,
        description,
        status,
        verifiedAt: status === 'VERIFIED' ? new Date().toISOString() : pkg.verifiedAt,
        verifiedBy: status === 'VERIFIED' ? user.id : pkg.verifiedBy,
      })

      if (!updatedPackage) {
        return NextResponse.json(
          { error: 'Failed to update package' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        package: {
          id: updatedPackage.id,
          name: updatedPackage.name,
          description: updatedPackage.description,
          status: updatedPackage.status,
          verifiedAt: updatedPackage.verifiedAt,
          verifiedBy: updatedPackage.verifiedBy,
        },
      })
    } catch (error) {
      console.error('Update package error:', error)
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
export const PUT = requireAuth(handler)