const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static('uploads'))

// Create uploads directory if it doesn't exist
const uploadsDir = 'uploads'
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/')
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Hanya file gambar dan PDF yang diperbolehkan'), false)
    }
  }
})

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server berjalan dengan baik' })
})

app.post('/api/upload', upload.array('files', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Tidak ada file yang diupload' })
    }

    const uploadedFiles = req.files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
      uploadDate: new Date().toISOString()
    }))

    res.json({
      message: 'File berhasil diupload',
      files: uploadedFiles
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat mengupload file' })
  }
})

app.get('/api/files', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir)
    const fileList = files.map(filename => {
      const filePath = path.join(uploadsDir, filename)
      const stats = fs.statSync(filePath)
      
      return {
        id: Math.random().toString(36).substr(2, 9),
        filename,
        size: stats.size,
        uploadDate: stats.birthtime.toISOString(),
        url: `/uploads/${filename}`
      }
    })

    res.json({ files: fileList })
  } catch (error) {
    console.error('Error reading files:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat membaca file' })
  }
})

app.delete('/api/files/:filename', (req, res) => {
  try {
    const filename = req.params.filename
    const filePath = path.join(uploadsDir, filename)
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      res.json({ message: 'File berhasil dihapus' })
    } else {
      res.status(404).json({ error: 'File tidak ditemukan' })
    }
  } catch (error) {
    console.error('Delete error:', error)
    res.status(500).json({ error: 'Terjadi kesalahan saat menghapus file' })
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File terlalu besar. Maksimal 10MB' })
    }
  }
  
  res.status(500).json({ error: error.message || 'Terjadi kesalahan server' })
})

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`)
  console.log(`Upload endpoint: http://localhost:${PORT}/api/upload`)
})