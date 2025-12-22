import { prisma } from './lib/prisma.js'

async function checkEmail() {
  try {
    const user = await prisma.user.findUnique({
      where: { email: 'anitcheouben14@gmail.com' }
    })
    
    if (user) {
      console.log('❌ Email DÉJÀ UTILISÉ dans la base de données:')
      console.log(`   ID: ${user.id}`)
      console.log(`   Nom: ${user.name}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   Créé le: ${user.createdAt}`)
    } else {
      console.log('✅ Email DISPONIBLE - vous pouvez l\'utiliser pour vous inscrire!')
    }
    
  } catch (error) {
    console.error('Erreur:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkEmail()
