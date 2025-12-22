import bcrypt from 'bcryptjs'
import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const plain = '1234'
const hashed = bcrypt.hashSync(plain, 10)
console.log('Setting hashed PIN:', hashed)
try {
  const r = await p.vendorApplication.updateMany({ where: { userId: 6 }, data: { userPin: hashed, pinSetAt: new Date() } })
  console.log('Updated rows:', r.count)
} catch (e) {
  console.error('ERROR', e)
} finally {
  await p.$disconnect()
}
