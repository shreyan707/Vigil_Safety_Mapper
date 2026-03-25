import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch'; // Make sure you have node-fetch or run this in a modern Node environment

const prisma = new PrismaClient();

// Sleep function to respect API rate limits
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('Fetching services without coordinates...');
  
  // Find all services where lat or lng is null
  const services = await prisma.service.findMany({
    where: {
      OR: [
        { lat: null },
        { lng: null }
      ]
    }
  });

  console.log(`Found ${services.length} services to geocode.`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < services.length; i++) {
    const service = services[i];
    
    // Create a clean address search string. OpenStreetMap works best with City, State, Country.
    // Taking the first part of the address string, which usually has the primary details.
    let searchAddress = service.address || "";
    
    if (!searchAddress || searchAddress.length < 3) {
      console.log(`[${i+1}/${services.length}] Skipping ID ${service.id} - Invalid address`);
      failCount++;
      continue;
    }

    try {
      // 1. Extract a 6-digit PIN code as our best chance for exact geocoding
      const pinMatch = searchAddress.match(/\b([1-9][0-9]{5})\b/);
      const parts = searchAddress.split(',').map(p => p.trim());
      const lastParts = parts.length > 1 ? parts.slice(-2).join(', ') : searchAddress;

      const strategies = [];
      
      // Strategy A: If we have a PIN code, try searching by PIN code + India
      if (pinMatch) {
        strategies.push(`postalcode=${pinMatch[1]}&countrycodes=in`);
        strategies.push(`q=${pinMatch[1]}, India`);
      }
      
      // Strategy B: Use the last two comma-separated chunks (usually "District, State")
      strategies.push(`q=${encodeURIComponent(lastParts)}&countrycodes=in`);
      
      // Strategy C: Take the very last word of the address (usually a City/State)
      const words = searchAddress.replace(/[-]/g, ' ').split(/\s+/);
      const lastWord = words[words.length - 1];
      if (lastWord.length > 3 && !pinMatch) {
        strategies.push(`q=${encodeURIComponent(lastWord)}, India&countrycodes=in`);
      }

      let lat = null;
      let lng = null;

      console.log(`[${i+1}/${services.length}] Geocoding: ${searchAddress.substring(0, 45)}...`);

      // Try strategies in order until one hits
      for (const strat of strategies) {
        const url = `https://nominatim.openstreetmap.org/search?format=json&${strat}&limit=1`;
        
        const response = await fetch(url, {
          headers: { 'User-Agent': 'VigilSafetyApp/1.0 (contact@vigil.org)' }
        });
        
        const data = await response.json();
        await sleep(1200); // Strict Rate Limit Respect

        if (data && data.length > 0) {
          lat = parseFloat(data[0].lat);
          lng = parseFloat(data[0].lon);
          break; // Stop searching if we found a hit!
        }
      }

      if (lat && lng) {
        await prisma.service.update({
          where: { id: service.id },
          data: { lat, lng }
        });
        console.log(`  -> Success! [${lat}, ${lng}]`);
        successCount++;
      } else {
        console.log(`  -> Not found using any strategy.`);
        failCount++;
      }

    } catch (error: any) {
      console.error(`  -> Error: ${error.message}`);
      failCount++;
    }

    // MANDATORY RATE LIMIT: Nominatim explicitly requires a MAXIMUM of 1 request per second.
    // We sleep for 1200ms to stay safely under the limit.
    await sleep(1200);
  }

  console.log('--- GEOCODING COMPLETE ---');
  console.log(`Successfully updated: ${successCount}`);
  console.log(`Failed to find: ${failCount}`);
  
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
