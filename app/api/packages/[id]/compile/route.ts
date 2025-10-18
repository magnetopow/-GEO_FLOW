import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { createCanvas, loadImage } from 'canvas'
import { jsPDF } from 'jspdf'

// POST /api/packages/[id]/compile - Compile package into PDF
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || (session.user.role !== 'VERIFIER' && session.user.role !== 'UPLOADER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { selectedImageIds } = await request.json()

    if (!selectedImageIds || !Array.isArray(selectedImageIds) || selectedImageIds.length === 0) {
      return NextResponse.json(
        { error: 'No images selected for compilation' },
        { status: 400 }
      )
    }

    // Get package with approved images
    const packageData = await prisma.package.findUnique({
      where: { id: params.id },
      include: {
        images: {
          where: {
            id: { in: selectedImageIds },
            verificationStatus: 'APPROVED'
          }
        }
      }
    })

    if (!packageData) {
      return NextResponse.json(
        { error: 'Package not found' },
        { status: 404 }
      )
    }

    if (packageData.images.length === 0) {
      return NextResponse.json(
        { error: 'No approved images found' },
        { status: 400 }
      )
    }

    // Create PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 10
    const imageWidth = pageWidth - (margin * 2)
    const imageHeight = pageHeight - (margin * 2)

    // Add title
    pdf.setFontSize(16)
    pdf.text(packageData.title || 'Dokumen Kompilasi', margin, margin + 10)

    // Add description if exists
    if (packageData.description) {
      pdf.setFontSize(10)
      const splitDescription = pdf.splitTextToSize(packageData.description, pageWidth - (margin * 2))
      pdf.text(splitDescription, margin, margin + 20)
    }

    let currentY = margin + 30

    for (let i = 0; i < packageData.images.length; i++) {
      const image = packageData.images[i]
      
      // Add new page if needed (except for first image)
      if (i > 0 && currentY + imageHeight > pageHeight - margin) {
        pdf.addPage()
        currentY = margin
      }

      try {
        // Load image
        const imagePath = join(process.cwd(), 'uploads', image.filename)
        const img = await loadImage(imagePath)
        
        // Calculate dimensions to fit within page while maintaining aspect ratio
        const aspectRatio = img.width / img.height
        let finalWidth = imageWidth
        let finalHeight = imageWidth / aspectRatio
        
        if (finalHeight > imageHeight) {
          finalHeight = imageHeight
          finalWidth = imageHeight * aspectRatio
        }

        // Center the image
        const x = margin + (imageWidth - finalWidth) / 2
        const y = currentY

        // Add image to PDF
        pdf.addImage(img, 'JPEG', x, y, finalWidth, finalHeight)
        
        // Add image name below
        pdf.setFontSize(8)
        pdf.text(image.originalName, margin, y + finalHeight + 5)
        
        currentY += finalHeight + 15
      } catch (imageError) {
        console.error(`Error processing image ${image.filename}:`, imageError)
        // Add placeholder for failed image
        pdf.setFontSize(10)
        pdf.text(`Error loading image: ${image.originalName}`, margin, currentY)
        currentY += 20
      }
    }

    // Save PDF
    const timestamp = Date.now()
    const filename = `compiled-${packageData.id}-${timestamp}.pdf`
    const filepath = join(process.cwd(), 'uploads', 'compiled', filename)
    
    // Create compiled directory if it doesn't exist
    try {
      await mkdir(join(process.cwd(), 'uploads', 'compiled'), { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    const pdfBuffer = pdf.output('arraybuffer')
    await writeFile(filepath, Buffer.from(pdfBuffer))

    // Save document record
    const document = await prisma.document.create({
      data: {
        title: packageData.title || 'Dokumen Kompilasi',
        filePath: `/uploads/compiled/${filename}`,
        fileSize: pdfBuffer.byteLength,
        packageId: packageData.id
      }
    })

    // Update package status
    await prisma.package.update({
      where: { id: params.id },
      data: { status: 'COMPILED' }
    })

    return NextResponse.json({ 
      document: {
        id: document.id,
        title: document.title,
        filePath: document.filePath,
        fileSize: document.fileSize,
        createdAt: document.createdAt
      }
    })
  } catch (error) {
    console.error('Error compiling package:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}