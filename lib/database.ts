import { readFile, writeFile, mkdir } from 'fs/promises'
import { join } from 'path'

const dataDir = join(process.cwd(), 'data')
const dbPath = join(dataDir, 'database.json')

// Ensure data directory exists
mkdir(dataDir, { recursive: true }).catch(() => {})

interface Database {
  users: any[]
  documentPackages: any[]
  uploadedFiles: any[]
  fileVerifications: any[]
  compiledDocuments: any[]
}

let db: Database = {
  users: [],
  documentPackages: [],
  uploadedFiles: [],
  fileVerifications: [],
  compiledDocuments: []
}

// Load database from file
const loadDatabase = async () => {
  try {
    const data = await readFile(dbPath, 'utf-8')
    db = JSON.parse(data)
  } catch (error) {
    // File doesn't exist, use empty database
    await saveDatabase()
  }
}

// Save database to file
const saveDatabase = async () => {
  await writeFile(dbPath, JSON.stringify(db, null, 2))
}

// Initialize database
loadDatabase()

// Helper functions
export const dbHelpers = {
  // User operations
  createUser: async (user: { username: string; email: string; password: string; role: string }) => {
    const newUser = {
      id: db.users.length + 1,
      username: user.username,
      email: user.email,
      password: user.password,
      role: user.role,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    db.users.push(newUser)
    await saveDatabase()
    return { lastInsertRowid: newUser.id }
  },

  getUserByEmail: (email: string) => {
    return db.users.find(user => user.email === email)
  },

  getUserById: (id: number) => {
    return db.users.find(user => user.id === id)
  },

  getAllUsers: () => {
    return db.users.map(({ password, ...user }) => user).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  },

  updateUser: async (id: number, updates: { username?: string; email?: string; role?: string }) => {
    const userIndex = db.users.findIndex(user => user.id === id)
    if (userIndex !== -1) {
      db.users[userIndex] = {
        ...db.users[userIndex],
        ...updates,
        updated_at: new Date().toISOString()
      }
      await saveDatabase()
    }
  },

  deleteUser: async (id: number) => {
    db.users = db.users.filter(user => user.id !== id)
    await saveDatabase()
  },

  // Document package operations
  createDocumentPackage: async (packageData: { id: string; uploaderId: number; title: string; description?: string }) => {
    const newPackage = {
      id: packageData.id,
      uploader_id: packageData.uploaderId,
      title: packageData.title,
      description: packageData.description,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    db.documentPackages.push(newPackage)
    await saveDatabase()
  },

  getDocumentPackage: (id: string) => {
    const pkg = db.documentPackages.find(p => p.id === id)
    if (!pkg) return null
    
    const uploader = db.users.find(u => u.id === pkg.uploader_id)
    return {
      ...pkg,
      uploader_name: uploader?.username || 'Unknown'
    }
  },

  getDocumentPackagesByUploader: (uploaderId: number) => {
    return db.documentPackages
      .filter(pkg => pkg.uploader_id === uploaderId)
      .map(pkg => {
        const files = db.uploadedFiles.filter(f => f.package_id === pkg.id)
        const verifications = db.fileVerifications.filter(fv => 
          files.some(f => f.id === fv.file_id)
        )
        return {
          ...pkg,
          file_count: files.length,
          verified_count: verifications.length
        }
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  getPendingPackages: () => {
    return db.documentPackages
      .filter(pkg => pkg.status === 'pending')
      .map(pkg => {
        const uploader = db.users.find(u => u.id === pkg.uploader_id)
        const files = db.uploadedFiles.filter(f => f.package_id === pkg.id)
        return {
          ...pkg,
          uploader_name: uploader?.username || 'Unknown',
          file_count: files.length
        }
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  },

  updatePackageStatus: async (id: string, status: string) => {
    const pkgIndex = db.documentPackages.findIndex(pkg => pkg.id === id)
    if (pkgIndex !== -1) {
      db.documentPackages[pkgIndex] = {
        ...db.documentPackages[pkgIndex],
        status,
        updated_at: new Date().toISOString()
      }
      await saveDatabase()
    }
  },

  // File operations
  createUploadedFile: async (fileData: {
    id: string;
    packageId: string;
    originalName: string;
    filename: string;
    filePath: string;
    fileSize: number;
    fileType: string;
    mimeType: string;
  }) => {
    const newFile = {
      id: fileData.id,
      package_id: fileData.packageId,
      original_name: fileData.originalName,
      filename: fileData.filename,
      file_path: fileData.filePath,
      file_size: fileData.fileSize,
      file_type: fileData.fileType,
      mime_type: fileData.mimeType,
      created_at: new Date().toISOString()
    }
    db.uploadedFiles.push(newFile)
    await saveDatabase()
  },

  getFilesByPackage: (packageId: string) => {
    return db.uploadedFiles
      .filter(file => file.package_id === packageId)
      .map(file => {
        const verification = db.fileVerifications.find(fv => fv.file_id === file.id)
        const verifier = verification ? db.users.find(u => u.id === verification.verifier_id) : null
        return {
          ...file,
          verification_status: verification?.status,
          notes: verification?.notes,
          verified_at: verification?.verified_at,
          verifier_name: verifier?.username
        }
      })
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  },

  // Verification operations
  createFileVerification: async (verificationData: {
    id: string;
    fileId: string;
    verifierId: number;
    status: string;
    notes?: string;
  }) => {
    const newVerification = {
      id: verificationData.id,
      file_id: verificationData.fileId,
      verifier_id: verificationData.verifierId,
      status: verificationData.status,
      notes: verificationData.notes,
      verified_at: new Date().toISOString()
    }
    db.fileVerifications.push(newVerification)
    await saveDatabase()
  },

  updateFileVerification: async (fileId: string, verifierId: number, status: string, notes?: string) => {
    const verificationIndex = db.fileVerifications.findIndex(
      fv => fv.file_id === fileId && fv.verifier_id === verifierId
    )
    if (verificationIndex !== -1) {
      db.fileVerifications[verificationIndex] = {
        ...db.fileVerifications[verificationIndex],
        status,
        notes,
        verified_at: new Date().toISOString()
      }
    } else {
      // Create new verification if doesn't exist
      await dbHelpers.createFileVerification({
        id: `verification_${Date.now()}`,
        fileId,
        verifierId,
        status,
        notes
      })
    }
    await saveDatabase()
  },

  // Compiled document operations
  createCompiledDocument: async (docData: {
    id: string;
    packageId: string;
    filename: string;
    filePath: string;
    fileSize: number;
    createdBy: number;
  }) => {
    const newDoc = {
      id: docData.id,
      package_id: docData.packageId,
      filename: docData.filename,
      file_path: docData.filePath,
      file_size: docData.fileSize,
      created_by: docData.createdBy,
      created_at: new Date().toISOString()
    }
    db.compiledDocuments.push(newDoc)
    await saveDatabase()
  },

  getCompiledDocuments: (packageId: string) => {
    return db.compiledDocuments
      .filter(doc => doc.package_id === packageId)
      .map(doc => {
        const creator = db.users.find(u => u.id === doc.created_by)
        return {
          ...doc,
          created_by_name: creator?.username || 'Unknown'
        }
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  },

  getFileVerification: (fileId: string, verifierId: number) => {
    return db.fileVerifications.find(fv => fv.file_id === fileId && fv.verifier_id === verifierId)
  }
}