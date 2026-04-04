import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const services = await prisma.service.findMany({
    where: { name: { contains: 'One Stop Centre' } },
    take: 10
  });

  for (const service of services) {
    if (!service.address) continue;
    const parts = service.address.split(',').map(p => p.trim()).filter(p => p.length > 0);
    const meaningfulParts = parts.filter(p => !p.toLowerCase().includes('india') && !/^\d{6}$/.test(p));
    
    let locationName = '';
    if (meaningfulParts.length > 0) {
      if (meaningfulParts.length > 2) {
        locationName = meaningfulParts[meaningfulParts.length - 2];
      } else {
        locationName = meaningfulParts[meaningfulParts.length - 1];
      }
    }
    
    console.log(`Original: ${service.name}`);
    console.log(`Address: ${service.address}`);
    console.log(`Extracted Location: ${locationName}`);
    console.log(`---`);
  }
}

main().finally(() => prisma.$disconnect());
