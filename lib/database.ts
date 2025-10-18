import fs from 'fs'
import path from 'path'

export interface User {
  id: string
  username: string
  email: string
  password: string
  role: 'ADMIN' | 'UPLOADER' | 'VERIFIER'
  createdAt: string
  updatedAt: string
}

export interface Image {
  id: string
  packageId: string
  originalName: string
  filename: string
  filePath: string
  size: number
  mimeType: string
  uploadedBy: string
  uploadedAt: string
  verifiedAt?: string
  verifiedBy?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  verificationNotes?: string
}

export interface Package {
  id: string
  name: string
  description?: string
  uploadedBy: string
  uploadedAt: string
  verifiedAt?: string
  verifiedBy?: string
  status: 'PENDING' | 'VERIFIED' | 'REJECTED' | 'COMPILED'
  images: Image[]
  compiledAt?: string
  compiledBy?: string
  compiledDocumentPath?: string
}

export interface Verification {
  id: string
  packageId: string
  imageId: string
  verifierId: string
  status: 'APPROVED' | 'REJECTED'
  notes?: string
  verifiedAt: string
}

class Database {
  private dataPath: string
  private users: User[] = []
  private packages: Package[] = []
  private verifications: Verification[] = []

  constructor() {
    this.dataPath = path.join(process.cwd(), 'data')
    this.ensureDataDirectory()
    this.loadData()
  }

  private ensureDataDirectory() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true })
    }
  }

  private loadData() {
    try {
      // Load users
      const usersPath = path.join(this.dataPath, 'users.json')
      if (fs.existsSync(usersPath)) {
        this.users = JSON.parse(fs.readFileSync(usersPath, 'utf8'))
      }

      // Load packages
      const packagesPath = path.join(this.dataPath, 'packages.json')
      if (fs.existsSync(packagesPath)) {
        this.packages = JSON.parse(fs.readFileSync(packagesPath, 'utf8'))
      }

      // Load verifications
      const verificationsPath = path.join(this.dataPath, 'verifications.json')
      if (fs.existsSync(verificationsPath)) {
        this.verifications = JSON.parse(fs.readFileSync(verificationsPath, 'utf8'))
      }
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  private saveData() {
    try {
      fs.writeFileSync(
        path.join(this.dataPath, 'users.json'),
        JSON.stringify(this.users, null, 2)
      )
      fs.writeFileSync(
        path.join(this.dataPath, 'packages.json'),
        JSON.stringify(this.packages, null, 2)
      )
      fs.writeFileSync(
        path.join(this.dataPath, 'verifications.json'),
        JSON.stringify(this.verifications, null, 2)
      )
    } catch (error) {
      console.error('Error saving data:', error)
    }
  }

  // User methods
  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): User {
    const newUser: User = {
      ...user,
      id: this.generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.users.push(newUser)
    this.saveData()
    return newUser
  }

  getUserById(id: string): User | undefined {
    return this.users.find(user => user.id === id)
  }

  getUserByEmail(email: string): User | undefined {
    return this.users.find(user => user.email === email)
  }

  getUserByUsername(username: string): User | undefined {
    return this.users.find(user => user.username === username)
  }

  getAllUsers(): User[] {
    return this.users
  }

  updateUser(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null {
    const userIndex = this.users.findIndex(user => user.id === id)
    if (userIndex === -1) return null

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    this.saveData()
    return this.users[userIndex]
  }

  deleteUser(id: string): boolean {
    const userIndex = this.users.findIndex(user => user.id === id)
    if (userIndex === -1) return false

    this.users.splice(userIndex, 1)
    this.saveData()
    return true
  }

  // Package methods
  createPackage(packageData: Omit<Package, 'id' | 'uploadedAt' | 'images'>): Package {
    const newPackage: Package = {
      ...packageData,
      id: this.generateId(),
      uploadedAt: new Date().toISOString(),
      images: [],
    }
    this.packages.push(newPackage)
    this.saveData()
    return newPackage
  }

  getPackageById(id: string): Package | undefined {
    return this.packages.find(pkg => pkg.id === id)
  }

  getPackagesByUser(userId: string): Package[] {
    return this.packages.filter(pkg => pkg.uploadedBy === userId)
  }

  getPackagesByStatus(status: Package['status']): Package[] {
    return this.packages.filter(pkg => pkg.status === status)
  }

  getAllPackages(): Package[] {
    return this.packages
  }

  updatePackage(id: string, updates: Partial<Omit<Package, 'id' | 'uploadedAt'>>): Package | null {
    const packageIndex = this.packages.findIndex(pkg => pkg.id === id)
    if (packageIndex === -1) return null

    this.packages[packageIndex] = {
      ...this.packages[packageIndex],
      ...updates,
    }
    this.saveData()
    return this.packages[packageIndex]
  }

  // Image methods
  addImageToPackage(packageId: string, image: Omit<Image, 'id' | 'packageId' | 'uploadedAt'>): Image | null {
    const pkg = this.getPackageById(packageId)
    if (!pkg) return null

    const newImage: Image = {
      ...image,
      id: this.generateId(),
      packageId,
      uploadedAt: new Date().toISOString(),
    }

    pkg.images.push(newImage)
    this.saveData()
    return newImage
  }

  updateImageStatus(imageId: string, status: Image['status'], verifiedBy?: string, notes?: string): Image | null {
    const pkg = this.packages.find(p => p.images.some(img => img.id === imageId))
    if (!pkg) return null

    const image = pkg.images.find(img => img.id === imageId)
    if (!image) return null

    image.status = status
    if (verifiedBy) {
      image.verifiedBy = verifiedBy
      image.verifiedAt = new Date().toISOString()
    }
    if (notes) {
      image.verificationNotes = notes
    }

    this.saveData()
    return image
  }

  // Verification methods
  createVerification(verification: Omit<Verification, 'id' | 'verifiedAt'>): Verification {
    const newVerification: Verification = {
      ...verification,
      id: this.generateId(),
      verifiedAt: new Date().toISOString(),
    }
    this.verifications.push(newVerification)
    this.saveData()
    return newVerification
  }

  getVerificationsByPackage(packageId: string): Verification[] {
    return this.verifications.filter(verification => verification.packageId === packageId)
  }

  getVerificationsByVerifier(verifierId: string): Verification[] {
    return this.verifications.filter(verification => verification.verifierId === verifierId)
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  }
}

export const db = new Database()