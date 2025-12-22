import { prisma } from './lib/prisma.js'
import bcrypt from 'bcryptjs'

async function createAdmin() {
  try {
    // Vérifier si admin existe déjà
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@test.com' }
    })

    if (existingAdmin) {
      console.log('Admin existe déjà:', existingAdmin.email)
      process.exit(0)
    }

    // Créer admin
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.create({
      data: {
        email: 'admin@test.com',
        password: hashedPassword,
        name: 'Admin Test',
        role: 'admin'
      }
    })

    console.log('✓ Admin créé avec succès!')
    console.log('Email: admin@test.com')
    console.log('Mot de passe: admin123')
    console.log('ID:', admin.id)
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
