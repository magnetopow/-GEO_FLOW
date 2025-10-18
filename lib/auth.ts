import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { dbHelpers } from './database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'

export interface User {
  id: number
  username: string
  email: string
  role: 'admin' | 'uploader' | 'verifikator'
  created_at: string
}

export interface AuthResult {
  success: boolean
  user?: User
  token?: string
  error?: string
}

export const authHelpers = {
  // Hash password
  hashPassword: async (password: string): Promise<string> => {
    const saltRounds = 12
    return await bcrypt.hash(password, saltRounds)
  },

  // Verify password
  verifyPassword: async (password: string, hashedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(password, hashedPassword)
  },

  // Generate JWT token
  generateToken: (user: User): string => {
    return jwt.sign(
      { 
        id: user.id, 
        username: user.username, 
        email: user.email, 
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    )
  },

  // Verify JWT token
  verifyToken: (token: string): User | null => {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      return {
        id: decoded.id,
        username: decoded.username,
        email: decoded.email,
        role: decoded.role,
        created_at: ''
      }
    } catch (error) {
      return null
    }
  },

  // Register new user
  register: async (userData: {
    username: string
    email: string
    password: string
    role: 'admin' | 'uploader' | 'verifikator'
  }): Promise<AuthResult> => {
    try {
      // Check if user already exists
      const existingUser = dbHelpers.getUserByEmail(userData.email)
      if (existingUser) {
        return {
          success: false,
          error: 'Email sudah terdaftar'
        }
      }

      // Hash password
      const hashedPassword = await authHelpers.hashPassword(userData.password)

      // Create user
      const result = dbHelpers.createUser({
        ...userData,
        password: hashedPassword
      })

      // Get created user
      const user = dbHelpers.getUserById(result.lastInsertRowid as number)
      if (!user) {
        return {
          success: false,
          error: 'Gagal membuat akun'
        }
      }

      // Generate token
      const token = authHelpers.generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      })

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        },
        token
      }
    } catch (error) {
      console.error('Registration error:', error)
      return {
        success: false,
        error: 'Terjadi kesalahan saat mendaftar'
      }
    }
  },

  // Login user
  login: async (email: string, password: string): Promise<AuthResult> => {
    try {
      // Get user by email
      const user = dbHelpers.getUserByEmail(email)
      if (!user) {
        return {
          success: false,
          error: 'Email atau password salah'
        }
      }

      // Verify password
      const isValidPassword = await authHelpers.verifyPassword(password, user.password)
      if (!isValidPassword) {
        return {
          success: false,
          error: 'Email atau password salah'
        }
      }

      // Generate token
      const token = authHelpers.generateToken({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      })

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          created_at: user.created_at
        },
        token
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        success: false,
        error: 'Terjadi kesalahan saat login'
      }
    }
  },

  // Get user from token
  getUserFromToken: (token: string): User | null => {
    return authHelpers.verifyToken(token)
  }
}

// Initialize default admin user
export const initializeDefaultAdmin = async () => {
  try {
    const adminExists = dbHelpers.getUserByEmail('admin@example.com')
    if (!adminExists) {
      const hashedPassword = await authHelpers.hashPassword('admin123')
      dbHelpers.createUser({
        username: 'admin',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin'
      })
      console.log('Default admin user created: admin@example.com / admin123')
    }
  } catch (error) {
    console.error('Error creating default admin:', error)
  }
}