import { prisma } from './lib/prisma.js'

async function listEmails() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true
      },
      orderBy: {
        id: 'asc'
      }
    })
    
    console.log('📧 Emails enregistrés dans la base de données:\n')
    users.forEach(user => {
      console.log(`  ${user.id}. ${user.email} (${user.name})`)
    })
    console.log(`\n📊 Total: ${users.length} utilisateurs`)
    
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

listEmails()
