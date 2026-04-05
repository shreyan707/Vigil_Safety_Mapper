import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Finding services that need provider logins...');
  
  // Find all services with lat/lng but no provider_id
  const services = await prisma.service.findMany({
    where: {
      lat: { not: null },
      lng: { not: null },
      provider_id: null
    }
  });

  console.log(`Found ${services.length} services to create accounts for.`);

  let createdCount = 0;

  for (const service of services) {
    if (!service.name) continue;
    
    // Generate a unique email based on service name and ID
    const baseName = service.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `${baseName.substring(0, 15)}_${service.id}@vigil.org`;
    const password = 'password123'; // Default password for all generate NGOs
    const hashedPassword = bcrypt.hashSync(password, 10);

    try {
      // Check if user already exists
      let user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            password: hashedPassword,
            role: 'provider',
            name: service.name.substring(0, 50)
          }
        });
        createdCount++;
      }

      // Link the service
      await prisma.service.update({
        where: { id: service.id },
        data: { provider_id: user.id }
      });

    } catch (err: any) {
      console.error(`Error creating provider for service ${service.id}: ${err.message}`);
    }
  }

  console.log(`Successfully created ${createdCount} new provider accounts and linked ${services.length} services.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
