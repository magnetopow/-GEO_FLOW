const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function createSampleUsers() {
  try {
    // Create uploader user
    const uploaderPassword = await bcrypt.hash('uploader123', 12)
    const uploader = await prisma.user.upsert({
      where: { email: 'uploader@example.com' },
      update: {},
      create: {
        email: 'uploader@example.com',
        name: 'User Uploader',
        password: uploaderPassword,
        role: 'UPLOADER'
      }
    })

    // Create verifier user
    const verifierPassword = await bcrypt.hash('verifier123', 12)
    const verifier = await prisma.user.upsert({
      where: { email: 'verifier@example.com' },
      update: {},
      create: {
        email: 'verifier@example.com',
        name: 'User Verifikator',
        password: verifierPassword,
        role: 'VERIFIER'
      }
    })

    console.log('Sample users created successfully:')
    console.log('Uploader - Email:', uploader.email, 'Password: uploader123')
    console.log('Verifier - Email:', verifier.email, 'Password: verifier123')
  } catch (error) {
    console.error('Error creating sample users:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createSampleUsers()