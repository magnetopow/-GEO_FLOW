import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/database'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

async function handler(
  request: NextRequest,
  { params }: { params: { id: string } },
  user: any
) {
  const packageId = params.id

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
      if (user.role !== 'UPLOADER' && user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Only uploaders can add images' },
          { status: 403 }
        )
      }

      if (pkg.uploadedBy !== user.id && user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        )
      }

      const formData = await request.formData()
      const files = formData.getAll('files') as File[]

      if (!files || files.length === 0) {
        return NextResponse.json(
          { error: 'No files provided' },
          { status: 400 }
        )
      }

      const uploadedImages = []

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          continue // Skip non-image files
        }

        // Generate unique filename
        const fileExtension = path.extname(file.originalName || file.name)
        const filename = `${uuidv4()}${fileExtension}`
        
        // Create upload directory
        const uploadDir = path.join(process.cwd(), 'uploads', packageId)
        await mkdir(uploadDir, { recursive: true })
        
        // Save file
        const filePath = path.join(uploadDir, filename)
        const bytes = await file.arrayBuffer()
        await writeFile(filePath, Buffer.from(bytes))

        // Add image to package
        const image = db.addImageToPackage(packageId, {
          originalName: file.name,
          filename,
          filePath: `/uploads/${packageId}/${filename}`,
          size: file.size,
          mimeType: file.type,
          uploadedBy: user.id,
          status: 'PENDING',
        })

        if (image) {
          uploadedImages.push({
            id: image.id,
            originalName: image.originalName,
            filename: image.filename,
            filePath: image.filePath,
            size: image.size,
            mimeType: image.mimeType,
            status: image.status,
          })
        }
      }

      return NextResponse.json({
        success: true,
        images: uploadedImages,
        message: `${uploadedImages.length} images uploaded successfully`,
      })
    } catch (error) {
      console.error('Upload images error:', error)
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