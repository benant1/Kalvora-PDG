import { prisma } from './lib/prisma.js'

async function checkUsers() {
  try {
    const users = await prisma.user.findMany()
    console.log('Total users:', users.length)
    console.log(JSON.stringify(users, null, 2))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUsers()
