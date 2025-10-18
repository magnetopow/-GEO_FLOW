import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { db, User } from './database'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
const JWT_EXPIRES_IN = '7d'

export interface AuthUser {
  id: string
  username: string
  email: string
  role: User['role']
}

export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
}

export function verifyToken(token: string): AuthUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return {
      id: decoded.id,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role,
    }
  } catch (error) {
    return null
  }
}

export async function authenticateUser(email: string, password: string): Promise<AuthUser | null> {
  const user = db.getUserByEmail(email)
  if (!user) return null

  const isValidPassword = await verifyPassword(password, user.password)
  if (!isValidPassword) return null

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  }
}

export async function createUser(userData: {
  username: string
  email: string
  password: string
  role: User['role']
}): Promise<AuthUser | null> {
  // Check if user already exists
  if (db.getUserByEmail(userData.email) || db.getUserByUsername(userData.username)) {
    return null
  }

  const hashedPassword = await hashPassword(userData.password)
  const user = db.createUser({
    ...userData,
    password: hashedPassword,
  })

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  }
}

export function requireAuth(handler: (req: any, res: any, user: AuthUser) => void) {
  return async (req: any, res: any) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const user = verifyToken(token)
    if (!user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    return handler(req, res, user)
  }
}

export function requireRole(roles: User['role'][]) {
  return (handler: (req: any, res: any, user: AuthUser) => void) => {
    return requireAuth((req, res, user) => {
      if (!roles.includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' })
      }
      return handler(req, res, user)
    })
  }
}