import { NextRequest, NextResponse } from 'next/server'
import { readdir, stat } from 'fs/promises'
import { join } from 'path'

export async function GET() {
  try {
    const uploadsDir = join(process.cwd(), 'uploads')
    
    try {
      const files = await readdir(uploadsDir)
      const fileList = await Promise.all(
        files.map(async (filename) => {
          const filePath = join(uploadsDir, filename)
          const stats = await stat(filePath)
          
          return {
            id: Math.random().toString(36).substr(2, 9),
            filename,
            size: stats.size,
            uploadDate: stats.birthtime.toISOString(),
            url: `/uploads/${filename}`
          }
        })
      )

      return NextResponse.json({ files: fileList })
    } catch (error) {
      // Directory doesn't exist yet
      return NextResponse.json({ files: [] })
    }
  } catch (error) {
    console.error('Error reading files:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat membaca file' },
      { status: 500 }
    )
  }
}