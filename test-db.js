import { prisma } from './lib/prisma.js'

async function testConnection() {
  try {
    console.log('Testing database connection...')
    
    // Test connection
    await prisma.$connect()
    console.log('✓ Connected to database')
    
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        name: 'Direct Test',
        email: 'directtest@example.com',
        password: 'hashed_password_here',
        role: 'user'
      }
    })
    console.log('✓ User created:', testUser)
    
    // Read all users
    const allUsers = await prisma.user.findMany()
    console.log('\n📊 Total users in database:', allUsers.length)
    allUsers.forEach(user => {
      console.log(`  - ${user.name} (${user.email})`)
    })
    
    // Clean up test user
    await prisma.user.delete({ where: { id: testUser.id } })
    console.log('\n✓ Test user deleted')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection()
