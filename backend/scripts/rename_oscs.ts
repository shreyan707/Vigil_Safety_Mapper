import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Fetching services to rename...');
  
  const services = await prisma.service.findMany({
    where: {
      name: {
        contains: 'One Stop Centre'
      }
    }
  });

  console.log(`Found ${services.length} services to process.`);

  let updatedCount = 0;

  for (const service of services) {
    if (!service.address || service.name !== 'One Stop Centre') continue; // Only rename if exactly or very close, or we can just always append district if it's currently exactly "One Stop Centre"

    // If it already has a location descriptor in the name, skip
    if (service.name.includes(',')) continue;

    const parts = service.address.split(',').map(p => p.trim()).filter(p => p.length > 0);
    
    let locationName = '';
    
    // Filter out parts that are too short, or look like PIN codes, or just say 'India'
    const meaningfulParts = parts.filter(p => 
      !p.toLowerCase().includes('india') && 
      !/^\d{6}$/.test(p) && 
      !/pincode/i.test(p) &&
      !/pin/i.test(p) &&
      p.length > 3
    );
    
    if (meaningfulParts.length > 0) {
      if (meaningfulParts.length > 1) {
        // District/City is usually the part before State. If last part is state, take the part before it.
        locationName = meaningfulParts[meaningfulParts.length - 2];
        
        // Sometimes the second to last part is just a random building. Let's make sure it's valid.
        // As a fallback, we could also use the state and district together but let's just stick to district.
      } else {
        locationName = meaningfulParts[meaningfulParts.length - 1];
      }
    }

    if (locationName) {
      // Clean up locationName (sometimes has extra spaces or hyphens at ends)
      locationName = locationName.replace(/^[-,\s]+|[-,\s]+$/g, '').trim();
      
      const newName = `One Stop Centre, ${locationName}`;
      
      // Only update if it's different and we found a location
      if (service.name !== newName && locationName.length > 2) {
        console.log(`Renaming: "${service.name}" -> "${newName}"`);
        
        await prisma.service.update({
          where: { id: service.id },
          data: { name: newName }
        });
        
        // Update user if linked
        if (service.provider_id) {
          await prisma.user.update({
            where: { id: service.provider_id },
            data: { name: newName }
          });
        }
        
        updatedCount++;
      }
    }
  }

  console.log(`\nSuccessfully updated ${updatedCount} service names.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
