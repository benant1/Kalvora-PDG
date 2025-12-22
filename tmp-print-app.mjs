import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()

try {
  const app = await p.vendorApplication.findUnique({ where: { userId: 6 } })
  console.log(JSON.stringify(app, null, 2))
} catch (e) {
  console.error('ERROR', e)
} finally {
  await p.$disconnect()
}
