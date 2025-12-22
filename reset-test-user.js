import { prisma } from './lib/prisma.js'
import bcrypt from 'bcryptjs'

async function resetUser() {
  try {
    // Delete existing user
    await prisma.user.delete({ where: { email: 'test@test.com' } }).catch(() => null)
    console.log('✓ Old user deleted')
    
    // Create new user with correct password
    const hashedPassword = await bcrypt.hash('password123', 10)
    const user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test@test.com',
        password: hashedPassword,
        role: 'user'
      }
    })
    
    console.log('✓ New user created:')
    console.log('  Email: test@test.com')
    console.log('  Password: password123')
    console.log('  ID:', user.id)
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

resetUser()
