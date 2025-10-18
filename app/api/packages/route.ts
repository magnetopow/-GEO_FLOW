import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/packages - Get packages based on user role
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const role = searchParams.get('role')

    let whereClause: any = {}

    // Filter based on user role
    if (session.user.role === 'UPLOADER') {
      whereClause.uploaderId = session.user.id
    } else if (session.user.role === 'VERIFIER') {
      whereClause.status = 'PENDING_VERIFICATION'
    }

    // Filter by status if provided
    if (status) {
      whereClause.status = status
    }

    const packages = await prisma.package.findMany({
      where: whereClause,
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
          select: {
            id: true,
            originalName: true,
            filePath: true,
            isVerified: true,
            verificationStatus: true
          }
        },
        document: {
          select: {
            id: true,
            title: true,
            filePath: true
          }
        },
        _count: {
          select: {
            images: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ packages })
  } catch (error) {
    console.error('Error fetching packages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/packages - Create new package
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'UPLOADER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { title, description, images } = await request.json()

    if (!images || images.length === 0) {
      return NextResponse.json(
        { error: 'No images provided' },
        { status: 400 }
      )
    }

    // Create package with images
    const packageData = await prisma.package.create({
      data: {
        title: title || `Paket ${new Date().toLocaleDateString('id-ID')}`,
        description,
        uploaderId: session.user.id,
        images: {
          create: images.map((image: any) => ({
            filename: image.filename,
            originalName: image.originalName,
            filePath: image.filePath,
            fileSize: image.fileSize,
            mimeType: image.mimeType
          }))
        }
      },
      include: {
        uploader: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        images: true,
        _count: {
          select: {
            images: true
          }
        }
      }
    })

    return NextResponse.json({ package: packageData }, { status: 201 })
  } catch (error) {
    console.error('Error creating package:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}