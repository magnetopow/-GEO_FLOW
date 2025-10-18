import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// POST /api/packages/[id]/verify - Verify package images
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'VERIFIER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { imageVerifications } = await request.json()

    if (!imageVerifications || !Array.isArray(imageVerifications)) {
      return NextResponse.json(
        { error: 'Invalid verification data' },
        { status: 400 }
      )
    }

    // Check if package exists and is pending verification
    const packageData = await prisma.package.findUnique({
      where: { id: params.id },
      include: {
        images: true
      }
    })

    if (!packageData) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    if (packageData.status !== 'PENDING_VERIFICATION') {
      return NextResponse.json(
        { error: 'Package is not pending verification' },
        { status: 400 }
      )
    }

    // Update image verification status
    const updatePromises = imageVerifications.map((verification: any) =>
      prisma.image.update({
        where: { id: verification.imageId },
        data: {
          isVerified: verification.status === 'APPROVED',
          verificationStatus: verification.status
        }
      })
    )

    await Promise.all(updatePromises)

    // Update package status to verified
    const updatedPackage = await prisma.package.update({
      where: { id: params.id },
      data: {
        status: 'VERIFIED',
        verifierId: session.user.id
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        verifier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        images: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    return NextResponse.json({ package: updatedPackage })
  } catch (error) {
    console.error('Error verifying package:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}