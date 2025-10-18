import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData()
    const file: File | null = data.get('file') as unknown as File

    if (!file) {
      return NextResponse.json({ error: 'Tidak ada file yang diupload' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads')
    try {
      await mkdir(uploadsDir, { recursive: true })
    } catch (error) {
      // Directory might already exist
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const fileExtension = file.name.split('.').pop()
    const filename = `${timestamp}-${randomString}.${fileExtension}`
    const filepath = join(uploadsDir, filename)

    // Write file to disk
    await writeFile(filepath, buffer)

    // Determine file type
    let fileType = 'screenshot'
    if (file.type === 'application/pdf') {
      fileType = 'pdf'
    } else if (file.type.startsWith('image/')) {
      // Simple heuristic for map detection
      fileType = file.name.toLowerCase().includes('map') ? 'map' : 'screenshot'
    }

    return NextResponse.json({
      message: 'File berhasil diupload',
      file: {
        id: Math.random().toString(36).substr(2, 9),
        originalName: file.name,
        filename: filename,
        size: file.size,
        type: fileType,
        url: `/uploads/${filename}`,
        uploadDate: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengupload file' },
      { status: 500 }
    )
  }
}