import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createTestVendor() {
  try {
    console.log('🔄 Création d\'un vendeur de test...')
    
    const hashedPassword = await bcrypt.hash('password123', 10)
    
    const vendor = await prisma.user.create({
      data: {
        name: 'Vendeur Test',
        email: 'vendeur@test.com',
        password: hashedPassword,
        role: 'vendor',
        vendorStatus: 'pending'
      }
    })
    
    console.log('✅ Vendeur créé avec succès:')
    console.log(`   Nom: ${vendor.name}`)
    console.log(`   Email: ${vendor.email}`)
    console.log(`   Rôle: ${vendor.role}`)
    console.log(`   Statut: ${vendor.vendorStatus}`)
    console.log(`\n📝 Vous pouvez maintenant voir ce vendeur dans l'onglet "Vendeurs" de l'admin`)
  } catch (error) {
    if (error.code === 'P2002') {
      console.log('⚠️  Un utilisateur avec cet email existe déjà')
    } else {
      console.error('❌ Erreur:', error)
    }
  } finally {
    await prisma.$disconnect()
  }
}

createTestVendor()
