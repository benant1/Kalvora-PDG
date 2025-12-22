import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function listAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        vendorStatus: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    })
    
    console.log(`\n📋 Total: ${users.length} utilisateur(s) dans la base de données\n`)
    console.log('ID | Nom | Email | Rôle | Statut Vendeur | Date d\'inscription')
    console.log('='.repeat(100))
    
    users.forEach(user => {
      const date = new Date(user.createdAt).toLocaleDateString('fr-FR')
      console.log(`${user.id} | ${user.name} | ${user.email} | ${user.role} | ${user.vendorStatus || 'N/A'} | ${date}`)
    })
    
    console.log('\n')
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

listAllUsers()
