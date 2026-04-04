import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const text = fs.readFileSync('oscs.txt', 'utf-8');
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const records: any[] = [];
  let currentBlock: string[] = [];

  // Ignore header lines, start reading
  let started = false;

  for (const line of lines) {
    if (!started) {
      if (line === '1' || line.startsWith('1 Andaman')) started = true;
      if (!started) continue;
    }

    // Skip page headers/footers
    if (line.startsWith('Page ') && line.includes('OSCs Directory')) continue;
    if (line.startsWith('Sl. No State/Uts')) continue;
    if (line === 'Contact Details') continue;
    if (line === 'Concerned official and OSC Email') continue;
    if (line === 'Address') continue;
    if (line === 'Date of Operational of') continue;
    if (line === 'OSC') continue;

    currentBlock.push(line);

    // If line ends with a date, or contains a date at the end
    if (/\d{2}\.\d{2}\.\d{4}$/.test(line) || /^\d{2}\.\d{2}\.\d{4}$/.test(line) || /sakhi/.test(line) && currentBlock.length > 4) {
      
       if (/\d{2}\.\d{2}\.\d{4}/.test(line)) {
          // Process block
          const fullText = currentBlock.join(' ');
          currentBlock = [];

          // Extract components
          // ID is the first number
          const match = fullText.match(/^(\d+)\s+(.+)/);
          if (!match) continue;

          // Find email
          const emailMatch = fullText.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
          const email = emailMatch ? emailMatch[1] : '';

          // Find phone (numbers with hyphens or spaces, length >= 10)
          // Look before the email usually
          const phoneMatches = fullText.match(/(\d{3,5}[-\s]?\d{6,8}|\d{10})/g);
          const phone = phoneMatches ? phoneMatches[0] : '';

          // Find address (everything between ID/State and the contact info)
          let address = fullText;
          if (email) address = address.replace(email, '');
          if (phone) address = address.replace(phone, '');
          address = address.replace(/\d{2}\.\d{2}\.\d{4}/g, ''); // remove dates
          address = address.replace(/^\d+\s+/, ''); // remove Sl no

          records.push({
            name: "One Stop Centre",
            type: "SafeZone",
            description: "Government supported One Stop Centre (OSC) for women affected by violence, providing legal, medical, and psychological support.",
            address: address.substring(0, 200).trim(), // truncate if too long
            phone: phone.substring(0, 50),
            email: email.substring(0, 50),
            hours: "24/7",
            languages: "Regional, Hindi, English",
            verified: 1,
          });
       }
    }
  }

  console.log(`Found ${records.length} valid OSC records. Inserting into database...`);

  let inserted = 0;
  for (const record of records) {
    try {
      await prisma.service.create({ data: record });
      inserted++;
    } catch (e) {
      // Ignore duplicates or errors
      console.log('Error inserting record', e.message);
    }
  }

  console.log(`Successfully inserted ${inserted} OSCs into the directory!`);
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
