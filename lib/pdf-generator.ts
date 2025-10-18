import jsPDF from 'jspdf'
import { Image } from './database'

export interface PDFOptions {
  title?: string
  author?: string
  subject?: string
  creator?: string
  pageSize?: 'A4' | 'A3' | 'LETTER'
  orientation?: 'portrait' | 'landscape'
  margin?: number
  imagesPerPage?: number
}

export class PDFGenerator {
  private doc: jsPDF
  private options: Required<PDFOptions>
  private currentY: number = 0
  private pageWidth: number
  private pageHeight: number
  private margin: number

  constructor(options: PDFOptions = {}) {
    this.options = {
      title: 'Compiled Document',
      author: 'Document Verification System',
      subject: 'Verified Images Compilation',
      creator: 'Image Verification App',
      pageSize: 'A4',
      orientation: 'portrait',
      margin: 20,
      imagesPerPage: 4,
      ...options,
    }

    this.doc = new jsPDF({
      orientation: this.options.orientation,
      unit: 'mm',
      format: this.options.pageSize,
    })

    this.pageWidth = this.doc.internal.pageSize.getWidth()
    this.pageHeight = this.doc.internal.pageSize.getHeight()
    this.margin = this.options.margin

    this.setupDocument()
  }

  private setupDocument() {
    this.doc.setProperties({
      title: this.options.title,
      author: this.options.author,
      subject: this.options.subject,
      creator: this.options.creator,
    })

    // Add title
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text(this.options.title, this.pageWidth / 2, 30, { align: 'center' })
    
    // Add date
    this.doc.setFontSize(12)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(
      `Generated on: ${new Date().toLocaleDateString('id-ID')}`,
      this.pageWidth / 2,
      40,
      { align: 'center' }
    )

    this.currentY = 50
  }

  async addImages(images: Image[]): Promise<void> {
    const imagesPerRow = this.options.imagesPerPage === 4 ? 2 : 3
    const imageWidth = (this.pageWidth - this.margin * 2 - (imagesPerRow - 1) * 10) / imagesPerRow
    const imageHeight = imageWidth * 0.75 // 4:3 aspect ratio

    let currentRow = 0
    let currentCol = 0

    for (let i = 0; i < images.length; i++) {
      const image = images[i]
      
      // Check if we need a new page
      if (this.currentY + imageHeight + 20 > this.pageHeight - this.margin) {
        this.doc.addPage()
        this.currentY = this.margin
        currentRow = 0
        currentCol = 0
      }

      const x = this.margin + currentCol * (imageWidth + 10)
      const y = this.currentY

      try {
        // Load image
        const img = new window.Image()
        img.crossOrigin = 'anonymous'
        
        await new Promise((resolve, reject) => {
          img.onload = () => {
            try {
              // Add image to PDF
              this.doc.addImage(
                img,
                'JPEG',
                x,
                y,
                imageWidth,
                imageHeight
              )

              // Add image filename below
              this.doc.setFontSize(8)
              this.doc.setFont('helvetica', 'normal')
              this.doc.text(
                image.originalName,
                x,
                y + imageHeight + 5,
                { maxWidth: imageWidth }
              )

              resolve(true)
            } catch (error) {
              reject(error)
            }
          }
          img.onerror = reject
          // Convert file path to full URL for browser
          img.src = image.filePath.startsWith('/') ? image.filePath : `/${image.filePath}`
        })

        currentCol++
        if (currentCol >= imagesPerRow) {
          currentCol = 0
          currentRow++
          this.currentY += imageHeight + 25
        }

      } catch (error) {
        console.error(`Error adding image ${image.originalName}:`, error)
        
        // Add placeholder for failed image
        this.doc.setFillColor(240, 240, 240)
        this.doc.rect(x, y, imageWidth, imageHeight, 'F')
        
        this.doc.setFontSize(10)
        this.doc.setFont('helvetica', 'normal')
        this.doc.text(
          `Error loading: ${image.originalName}`,
          x + imageWidth / 2,
          y + imageHeight / 2,
          { align: 'center' }
        )

        currentCol++
        if (currentCol >= imagesPerRow) {
          currentCol = 0
          currentRow++
          this.currentY += imageHeight + 25
        }
      }
    }
  }

  addPageBreak(): void {
    this.doc.addPage()
    this.currentY = this.margin
  }

  addText(text: string, x?: number, y?: number, options?: any): void {
    const textX = x || this.margin
    const textY = y || this.currentY
    
    this.doc.text(text, textX, textY, options)
    this.currentY = textY + 10
  }

  addHeader(text: string, level: 1 | 2 | 3 = 1): void {
    const fontSize = level === 1 ? 16 : level === 2 ? 14 : 12
    this.doc.setFontSize(fontSize)
    this.doc.setFont('helvetica', 'bold')
    this.addText(text)
    this.doc.setFont('helvetica', 'normal')
    this.doc.setFontSize(10)
  }

  generateBlob(): Blob {
    return this.doc.output('blob')
  }

  generateDataURL(): string {
    return this.doc.output('dataurlstring')
  }

  save(filename?: string): void {
    const fileName = filename || `${this.options.title.replace(/\s+/g, '_')}_${Date.now()}.pdf`
    this.doc.save(fileName)
  }

  getPageCount(): number {
    return this.doc.getNumberOfPages()
  }
}

export async function generatePDFFromImages(
  images: Image[],
  options: PDFOptions = {}
): Promise<Blob> {
  const generator = new PDFGenerator(options)
  await generator.addImages(images)
  return generator.generateBlob()
}

export async function generatePDFFromPackage(
  packageId: string,
  options: PDFOptions = {}
): Promise<Blob> {
  // This would typically fetch images from database
  // For now, we'll assume images are passed directly
  const generator = new PDFGenerator({
    title: `Package ${packageId}`,
    ...options,
  })
  
  // Add package info
  generator.addHeader(`Package: ${packageId}`)
  generator.addText(`Total Images: ${images.length}`)
  generator.addText(`Generated: ${new Date().toLocaleString('id-ID')}`)
  generator.addPageBreak()
  
  await generator.addImages(images)
  return generator.generateBlob()
}