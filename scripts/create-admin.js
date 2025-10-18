const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

async function createDefaultAdmin() {
  try {
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // Check if admin already exists
    const usersPath = path.join(dataDir, 'users.json')
    let users = []
    
    if (fs.existsSync(usersPath)) {
      users = JSON.parse(fs.readFileSync(usersPath, 'utf8'))
      const adminExists = users.find(user => user.role === 'ADMIN')
      if (adminExists) {
        console.log('Admin user already exists')
        return
      }
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12)
    const adminUser = {
      id: 'admin-' + Date.now(),
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    users.push(adminUser)
    
    // Save to file
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2))
    
    console.log('Default admin user created successfully!')
    console.log('Email: admin@example.com')
    console.log('Password: admin123')
    console.log('Role: ADMIN')
  } catch (error) {
    console.error('Error creating admin user:', error)
  }
}

createDefaultAdmin()