import { prisma } from './lib/prisma.js'
import bcrypt from 'bcryptjs'

async function createAdmin() {
  try {
    await prisma.user.delete({ where: { email: 'anitcheouben14@gmail.com' } }).catch(() => null)
    const hashedPassword = await bcrypt.hash('ben@2006', 10)
    const admin = await prisma.user.create({
      data: {
        name: 'Admin User',
        email: 'anitcheouben14@gmail.com',
        password: hashedPassword,
        role: 'admin'
      }
    })
    console.log('\n✅ ADMIN ACCOUNT CREATED')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📧 Email:    anitcheouben14@gmail.com')
    console.log('🔑 Password: ben@2006')
    console.log('👤 Role:     admin')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
