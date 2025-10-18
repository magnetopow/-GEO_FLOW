const { spawn } = require('child_process')
const path = require('path')

console.log('🚀 Starting GEO FLOW development server...')

// Start Next.js development server
const next = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd()
})

next.on('error', (err) => {
  console.error('Failed to start Next.js:', err)
})

next.on('close', (code) => {
  console.log(`Next.js process exited with code ${code}`)
})

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...')
  next.kill('SIGINT')
  process.exit(0)
})

process.on('SIGTERM', () => {
  next.kill('SIGTERM')
  process.exit(0)
})