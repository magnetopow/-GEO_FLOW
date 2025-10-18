import { NextRequest, NextResponse } from 'next/server'
import { authHelpers } from '@/lib/auth'
import { dbHelpers } from '@/lib/database'
import { v4 as uuidv4 } from 'uuid'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { createCanvas, loadImage } from 'canvas'

export async function POST(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const user = authHelpers.getUserFromToken(token)
    
    if (!user || !['verifikator', 'uploader', 'admin'].includes(user.role)) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const { packageId, fileIds, title } = await request.json()

    if (!packageId || !fileIds || fileIds.length === 0) {
      return NextResponse.json({ error: 'Package ID dan file IDs harus diisi' }, { status: 400 })
    }

    // Get package details
    const packageData = dbHelpers.getDocumentPackage(packageId)
    if (!packageData) {
      return NextResponse.json({ error: 'Paket tidak ditemukan' }, { status: 404 })
    }

    // Get files to compile
    const allFiles = dbHelpers.getFilesByPackage(packageId)
    const filesToCompile = allFiles.filter(file => fileIds.includes(file.id))

    if (filesToCompile.length === 0) {
      return NextResponse.json({ error: 'Tidak ada file yang valid untuk dikompilasi' }, { status: 400 })
    }

    // Create compiled document
    const documentId = uuidv4()
    const filename = `compiled-${documentId}.pdf`
    
    // For now, we'll create a simple image compilation
    // In a real implementation, you would use a PDF library like jsPDF
    const compiledDocument = await createImageCompilation(filesToCompile, title || packageData.title)
    
    // Save compiled document
    const compiledDir = join(process.cwd(), 'compiled')
    await mkdir(compiledDir, { recursive: true })
    
    const filePath = join(compiledDir, filename)
    await writeFile(filePath, compiledDocument)

    // Save to database
    dbHelpers.createCompiledDocument({
      id: documentId,
      packageId,
      filename,
      filePath: `/compiled/${filename}`,
      fileSize: compiledDocument.length,
      createdBy: user.id
    })

    return NextResponse.json({
      message: 'Dokumen berhasil dikompilasi',
      document: {
        id: documentId,
        filename,
        filePath: `/compiled/${filename}`,
        fileSize: compiledDocument.length
      }
    })
  } catch (error) {
    console.error('Error compiling document:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengompilasi dokumen' },
      { status: 500 }
    )
  }
}

async function createImageCompilation(files: any[], title: string): Promise<Buffer> {
  // This is a simplified implementation
  // In a real application, you would use a proper PDF library like jsPDF or PDFKit
  
  // For now, we'll create a simple text file as a placeholder
  const content = `
COMPILED DOCUMENT: ${title}
Generated on: ${new Date().toLocaleString('id-ID')}
Total files: ${files.length}

Files included:
${files.map((file, index) => `${index + 1}. ${file.original_name}`).join('\n')}

This is a placeholder implementation. In a real application, 
this would be a properly formatted PDF document with the images.
  `
  
  return Buffer.from(content, 'utf-8')
}