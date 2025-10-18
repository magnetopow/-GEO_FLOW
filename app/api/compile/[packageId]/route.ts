import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/database'
import { generatePDFFromImages } from '@/lib/pdf-generator'

async function handler(
  request: NextRequest,
  { params }: { params: { packageId: string } },
  user: any
) {
  const packageId = params.packageId

  if (request.method === 'POST') {
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

      // Only compile verified packages
      if (pkg.status !== 'VERIFIED') {
        return NextResponse.json(
          { error: 'Package must be verified before compilation' },
          { status: 400 }
        )
      }

      // Get approved images only
      const approvedImages = pkg.images.filter(img => img.status === 'APPROVED')
      
      if (approvedImages.length === 0) {
        return NextResponse.json(
          { error: 'No approved images to compile' },
          { status: 400 }
        )
      }

      // Generate PDF
      const pdfBlob = await generatePDFFromImages(approvedImages, {
        title: pkg.name,
        author: user.username,
        subject: `Compiled Document - ${pkg.name}`,
      })

      // Convert blob to buffer
      const arrayBuffer = await pdfBlob.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Update package status
      db.updatePackage(packageId, {
        status: 'COMPILED',
        compiledAt: new Date().toISOString(),
        compiledBy: user.id,
        compiledDocumentPath: `/compiled/${packageId}_${Date.now()}.pdf`,
      })

      // Return PDF as response
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${pkg.name.replace(/\s+/g, '_')}_compiled.pdf"`,
          'Content-Length': buffer.length.toString(),
        },
      })
    } catch (error) {
      console.error('Compilation error:', error)
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

export const POST = requireAuth(handler)