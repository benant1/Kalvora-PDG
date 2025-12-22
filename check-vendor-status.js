import { prisma } from './lib/prisma.js'

async function checkVendorStatus() {
  try {
    // Récupérer toutes les demandes vendeur
    const applications = await prisma.vendorApplication.findMany({
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            vendorStatus: true
          }
        }
      }
    })

    console.log('\n=== TOUTES LES DEMANDES VENDEUR ===\n')
    
    if (applications.length === 0) {
      console.log('Aucune demande vendeur trouvée.')
    } else {
      applications.forEach(app => {
        console.log(`User: ${app.user.name} (${app.user.email})`)
        console.log(`  User ID: ${app.user.id}`)
        console.log(`  Application ID: ${app.id}`)
        console.log(`  Status: ${app.status}`)
        console.log(`  User vendorStatus: ${app.user.vendorStatus}`)
        console.log(`  Store: ${app.storeName}`)
        if (app.rejectionReason) {
          console.log(`  Rejection Reason: ${app.rejectionReason}`)
        }
        console.log('---')
      })
    }

    console.log(`\nTotal: ${applications.length} demande(s)\n`)
  } catch (error) {
    console.error('Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkVendorStatus()
