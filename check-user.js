import { prisma } from './lib/prisma.js'

async function checkUser() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'test@test.com' },
      select: { id: true, email: true, name: true, role: true }
    })
    
    if (user) {
      console.log('✓ User found in database:')
      console.log(JSON.stringify(user, null, 2))
    } else {
      console.log('✗ User not found - need to create')
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
