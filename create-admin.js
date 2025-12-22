import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  try {
    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash('ben@2006', 10)

    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'anitcheouben14@gmail.com' }
    })

    if (existingAdmin) {
      console.log('❌ Cet email est déjà utilisé')
      return
    }

    // Créer l'utilisateur admin
    const admin = await prisma.user.create({
      data: {
        email: 'anitcheouben14@gmail.com',
        name: 'Admin User',
        password: hashedPassword,
        role: 'admin'
      }
    })

    console.log('✅ Admin créé avec succès:')
    console.log(`📧 Email: ${admin.email}`)
    console.log(`🔐 Mot de passe: ben@2006`)
    console.log(`👤 Rôle: ${admin.role}`)
    console.log(`🆔 ID: ${admin.id}`)
  } catch (error) {
    console.error('❌ Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
