import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateSellers() {
  try {
    console.log('🔄 Migration des vendeurs...')
    
    // Trouver tous les utilisateurs avec le rôle 'seller'
    const sellers = await prisma.user.findMany({
      where: { role: 'seller' }
    })
    
    console.log(`📋 ${sellers.length} utilisateur(s) avec le rôle 'seller' trouvé(s)`)
    
    if (sellers.length === 0) {
      console.log('✅ Aucune migration nécessaire')
      return
    }
    
    // Convertir chaque seller en vendor avec vendorStatus pending
    for (const seller of sellers) {
      await prisma.user.update({
        where: { id: seller.id },
        data: {
          role: 'vendor',
          vendorStatus: 'pending'
        }
      })
      console.log(`✓ Converti: ${seller.name} (${seller.email}) → vendor (pending)`)
    }
    
    console.log(`✅ Migration terminée: ${sellers.length} utilisateur(s) converti(s)`)
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

migrateSellers()
