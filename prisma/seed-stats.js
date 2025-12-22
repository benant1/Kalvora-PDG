import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seedDownloadsAndPurchases() {
  try {
    console.log('Seeding downloads and purchases...')

    // Get all users
    const users = await prisma.user.findMany()
    
    if (users.length === 0) {
      console.log('No users found. Please create users first.')
      return
    }

    // Get templates and designs
    const templates = await prisma.template.findMany()
    const designs = await prisma.design.findMany()

    console.log(`Found ${users.length} users, ${templates.length} templates, ${designs.length} designs`)

    // Create sample downloads for the last 7 days
    const downloads = []
    const purchases = []
    
    for (let i = 0; i < 30; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]
      const randomDays = Math.floor(Math.random() * 7)
      const date = new Date()
      date.setDate(date.getDate() - randomDays)

      // Random template download
      if (templates.length > 0 && Math.random() > 0.5) {
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)]
        downloads.push({
          userId: randomUser.id,
          itemType: 'template',
          itemId: randomTemplate.id,
          itemName: randomTemplate.name,
          createdAt: date
        })
      }

      // Random design download
      if (designs.length > 0 && Math.random() > 0.5) {
        const randomDesign = designs[Math.floor(Math.random() * designs.length)]
        downloads.push({
          userId: randomUser.id,
          itemType: 'design',
          itemId: randomDesign.id,
          itemName: randomDesign.title,
          createdAt: date
        })
      }
    }

    // Create sample purchases
    for (let i = 0; i < 20; i++) {
      const randomUser = users[Math.floor(Math.random() * users.length)]
      const randomDays = Math.floor(Math.random() * 7)
      const date = new Date()
      date.setDate(date.getDate() - randomDays)

      const itemTypes = ['template', 'design']
      const randomType = itemTypes[Math.floor(Math.random() * itemTypes.length)]

      if (randomType === 'template' && templates.length > 0) {
        const randomTemplate = templates[Math.floor(Math.random() * templates.length)]
        purchases.push({
          userId: randomUser.id,
          itemType: 'template',
          itemId: randomTemplate.id,
          itemName: randomTemplate.name,
          amount: randomTemplate.price,
          createdAt: date
        })
      } else if (randomType === 'design' && designs.length > 0) {
        const randomDesign = designs[Math.floor(Math.random() * designs.length)]
        purchases.push({
          userId: randomUser.id,
          itemType: 'design',
          itemId: randomDesign.id,
          itemName: randomDesign.title,
          amount: randomDesign.price,
          createdAt: date
        })
      }
    }

    // Insert downloads
    if (downloads.length > 0) {
      await prisma.download.createMany({ data: downloads })
      console.log(`✅ Created ${downloads.length} downloads`)
    }

    // Insert purchases
    if (purchases.length > 0) {
      await prisma.purchase.createMany({ data: purchases })
      console.log(`✅ Created ${purchases.length} purchases`)
    }

    console.log('✅ Seeding completed successfully!')
  } catch (error) {
    console.error('Error seeding data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

seedDownloadsAndPurchases()
