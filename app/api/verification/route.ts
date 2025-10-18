import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/lib/auth'
import { db } from '@/lib/database'

async function handler(request: NextRequest, user: any) {
  if (request.method === 'POST') {
    try {
      const { packageId, imageId, status, notes } = await request.json()

      if (!packageId || !imageId || !status) {
        return NextResponse.json(
          { error: 'Package ID, Image ID, and status are required' },
          { status: 400 }
        )
      }

      if (!['APPROVED', 'REJECTED'].includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status. Must be APPROVED or REJECTED' },
          { status: 400 }
        )
      }

      // Verify package exists
      const pkg = db.getPackageById(packageId)
      if (!pkg) {
        return NextResponse.json(
          { error: 'Package not found' },
          { status: 404 }
        )
      }

      // Update image status
      const updatedImage = db.updateImageStatus(
        imageId,
        status,
        user.id,
        notes
      )

      if (!updatedImage) {
        return NextResponse.json(
          { error: 'Image not found' },
          { status: 404 }
        )
      }

      // Create verification record
      const verification = db.createVerification({
        packageId,
        imageId,
        verifierId: user.id,
        status,
        notes,
      })

      return NextResponse.json({
        success: true,
        verification: {
          id: verification.id,
          packageId: verification.packageId,
          imageId: verification.imageId,
          verifierId: verification.verifierId,
          status: verification.status,
          notes: verification.notes,
          verifiedAt: verification.verifiedAt,
        },
        image: {
          id: updatedImage.id,
          status: updatedImage.status,
          verifiedBy: updatedImage.verifiedBy,
          verifiedAt: updatedImage.verifiedAt,
          verificationNotes: updatedImage.verificationNotes,
        },
      })
    } catch (error) {
      console.error('Verification error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }

  if (request.method === 'GET') {
    try {
      const { packageId } = request.nextUrl.searchParams
      
      if (packageId) {
        const verifications = db.getVerificationsByPackage(packageId)
        return NextResponse.json({
          success: true,
          verifications,
        })
      } else {
        const verifications = db.getVerificationsByVerifier(user.id)
        return NextResponse.json({
          success: true,
          verifications,
        })
      }
    } catch (error) {
      console.error('Get verifications error:', error)
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

export const GET = requireRole(['VERIFIER', 'ADMIN'])(handler)
export const POST = requireRole(['VERIFIER', 'ADMIN'])(handler)