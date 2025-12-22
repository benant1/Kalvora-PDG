import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const pin = '1234';
  const hash = bcrypt.hashSync(pin, 10);
  
  console.log('Hash généré:', hash);
  console.log('Longueur hash:', hash.length);
  
  // Mettre à jour le PIN pour userId=6
  const result = await prisma.vendorApplication.updateMany({
    where: { userId: 6 },
    data: { 
      userPin: hash,
      pinSetAt: new Date()
    }
  });
  console.log('Résultat mise à jour:', result);
  
  // Vérifier ce qui est stocké
  const app = await prisma.vendorApplication.findFirst({
    where: { userId: 6 },
    select: { userPin: true, userId: true }
  });
  
  console.log('PIN stocké en base:', app.userPin);
  console.log('Longueur stockée:', app.userPin ? app.userPin.length : 0);
  
  // Tester la comparaison
  const match = bcrypt.compareSync(pin, app.userPin);
  console.log(`Vérification "${pin}" contre le hash:`, match ? '✅ OK' : '❌ ÉCHEC');
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
