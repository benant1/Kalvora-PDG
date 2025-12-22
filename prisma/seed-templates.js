import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedTemplatesAndDesigns() {
  try {
    console.log('Seeding templates and designs...')

    // Create sample templates
    const templates = [
      {
        name: "Dashboard Admin Modern",
        description: "Template web moderne pour dashboard administrateur avec React et Tailwind CSS",
        category: "web",
        price: 49.99,
        featured: true
      },
      {
        name: "E-commerce Mobile App",
        description: "Application mobile complète pour e-commerce avec React Native",
        category: "mobile",
        price: 79.99,
        featured: true
      },
      {
        name: "Landing Page Startup",
        description: "Landing page moderne et responsive pour startup",
        category: "web",
        price: 29.99,
        featured: false
      },
      {
        name: "Portfolio Designer",
        description: "Template de portfolio pour designers créatifs",
        category: "web",
        price: 39.99,
        featured: false
      },
      {
        name: "Fitness Tracker App",
        description: "Application mobile de suivi fitness et santé",
        category: "mobile",
        price: 59.99,
        featured: false
      }
    ]

    // Create sample designs
    const designs = [
      {
        title: "Logo Moderne Tech",
        description: "Logo moderne pour entreprise technologique",
        category: "logo",
        imageUrl: "https://via.placeholder.com/400x300",
        price: 199.99,
        featured: true
      },
      {
        title: "UI Kit Dashboard",
        description: "Kit UI complet pour dashboard administrateur",
        category: "ui",
        imageUrl: "https://via.placeholder.com/400x300",
        price: 89.99,
        featured: true
      },
      {
        title: "Illustrations Business",
        description: "Pack d'illustrations pour sites business",
        category: "illustration",
        imageUrl: "https://via.placeholder.com/400x300",
        price: 49.99,
        featured: false
      },
      {
        title: "Icônes Minimales",
        description: "Set de 100 icônes minimales vectorielles",
        category: "graphic",
        imageUrl: "https://via.placeholder.com/400x300",
        price: 29.99,
        featured: false
      }
    ]

    // Insert templates
    for (const template of templates) {
      await prisma.template.create({ data: template })
    }
    console.log(`✅ Created ${templates.length} templates`)

    // Insert designs
    for (const design of designs) {
      await prisma.design.create({ data: design })
    }
    console.log(`✅ Created ${designs.length} designs`)

    console.log('✅ Seeding completed! Now run seed-stats.js to generate activity data.')
  } catch (error) {
    console.error('Error seeding data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedTemplatesAndDesigns()
