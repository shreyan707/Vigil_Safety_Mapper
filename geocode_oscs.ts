import 'dotenv/config';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const USER_AGENT = 'VigilSafetyApp/1.0 (contact@vigil.org)';
const REQUEST_DELAY_MS = 1100;
const RETRY_DELAY_MS = 5000;

const INDIA_STATE_ALIASES: Array<{ canonical: string; aliases: string[] }> = [
  { canonical: 'Andaman and Nicobar Islands', aliases: ['andaman and nicobar islands', 'andaman & nicobar islands', 'andaman and nicobar', 'andaman nicobar'] },
  { canonical: 'Andhra Pradesh', aliases: ['andhra pradesh'] },
  { canonical: 'Arunachal Pradesh', aliases: ['arunachal pradesh'] },
  { canonical: 'Assam', aliases: ['assam'] },
  { canonical: 'Bihar', aliases: ['bihar'] },
  { canonical: 'Chandigarh', aliases: ['chandigarh'] },
  { canonical: 'Chhattisgarh', aliases: ['chhattisgarh'] },
  { canonical: 'Dadra and Nagar Haveli and Daman and Diu', aliases: ['dadra and nagar haveli and daman and diu', 'dadra & nagar haveli and daman & diu', 'daman and diu', 'dadra and nagar haveli'] },
  { canonical: 'Delhi', aliases: ['delhi', 'nct of delhi', 'national capital territory of delhi', 'new delhi'] },
  { canonical: 'Goa', aliases: ['goa'] },
  { canonical: 'Gujarat', aliases: ['gujarat'] },
  { canonical: 'Haryana', aliases: ['haryana'] },
  { canonical: 'Himachal Pradesh', aliases: ['himachal pradesh'] },
  { canonical: 'Jammu and Kashmir', aliases: ['jammu and kashmir', 'jammu & kashmir'] },
  { canonical: 'Jharkhand', aliases: ['jharkhand'] },
  { canonical: 'Karnataka', aliases: ['karnataka'] },
  { canonical: 'Kerala', aliases: ['kerala'] },
  { canonical: 'Ladakh', aliases: ['ladakh'] },
  { canonical: 'Lakshadweep', aliases: ['lakshadweep'] },
  { canonical: 'Madhya Pradesh', aliases: ['madhya pradesh'] },
  { canonical: 'Maharashtra', aliases: ['maharashtra'] },
  { canonical: 'Manipur', aliases: ['manipur'] },
  { canonical: 'Meghalaya', aliases: ['meghalaya'] },
  { canonical: 'Mizoram', aliases: ['mizoram'] },
  { canonical: 'Nagaland', aliases: ['nagaland'] },
  { canonical: 'Odisha', aliases: ['odisha', 'orissa'] },
  { canonical: 'Puducherry', aliases: ['puducherry', 'pondicherry'] },
  { canonical: 'Punjab', aliases: ['punjab'] },
  { canonical: 'Rajasthan', aliases: ['rajasthan'] },
  { canonical: 'Sikkim', aliases: ['sikkim'] },
  { canonical: 'Tamil Nadu', aliases: ['tamil nadu'] },
  { canonical: 'Telangana', aliases: ['telangana'] },
  { canonical: 'Tripura', aliases: ['tripura'] },
  { canonical: 'Uttar Pradesh', aliases: ['uttar pradesh'] },
  { canonical: 'Uttarakhand', aliases: ['uttarakhand', 'uttaranchal'] },
  { canonical: 'West Bengal', aliases: ['west bengal'] },
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeForMatch(value: string) {
  return value
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanAddress(address: string | null | undefined) {
  return (address || '')
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, ' ')
    .replace(/\b\d{2}\.\d{2}\.\d{4}\b/g, ' ')
    .replace(/\b\d{3,5}[-\s]?\d{6,8}\b/g, ' ')
    .replace(/\b\d{10}\b/g, ' ')
    .replace(/\b\d{3}\b/g, ' ')
    .replace(/[;|]/g, ',')
    .replace(/\s+/g, ' ')
    .replace(/\s*,\s*/g, ', ')
    .replace(/,\s*,+/g, ', ')
    .replace(/\s+-\s+/g, ', ')
    .replace(/,+$/g, '')
    .trim();
}

function extractState(cleanedAddress: string) {
  const normalized = normalizeForMatch(cleanedAddress);

  for (const entry of INDIA_STATE_ALIASES) {
    for (const alias of entry.aliases) {
      if (normalized.includes(alias)) {
        return entry.canonical;
      }
    }
  }

  return null;
}

function extractDistrict(cleanedAddress: string) {
  const withoutLeadingStateCount = cleanedAddress.replace(/^[A-Za-z&/().\s-]+?\(\d+\)\s+/, '').trim();
  const oneStopMatch = withoutLeadingStateCount.match(/^(.+?)\s+One Stop Centre\b/i);
  if (!oneStopMatch) {
    return null;
  }

  let district = oneStopMatch[1]
    .replace(/\bstate\/uts?\b/gi, ' ')
    .replace(/\bstate\b/gi, ' ')
    .replace(/\but\b/gi, ' ')
    .replace(/\(\w+\)/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  const matchedState = extractState(district);
  if (matchedState) {
    district = district.replace(new RegExp(matchedState, 'ig'), '').replace(/\s+/g, ' ').trim();
  }

  return district || null;
}

function extractLocationSegments(cleanedAddress: string) {
  const parts = cleanedAddress
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => /[a-z]/i.test(part))
    .filter((part) => !/one stop centre/i.test(part))
    .filter((part) => !/^\d+$/.test(part));

  return [...new Set(parts)];
}

function buildQueries(cleanedAddress: string) {
  const district = extractDistrict(cleanedAddress);
  const state = extractState(cleanedAddress);
  const pinMatch = cleanedAddress.match(/\b([1-9][0-9]{5})\b/);
  const segments = extractLocationSegments(cleanedAddress);
  const queries: string[] = [];

  if (district && state) {
    queries.push(`${district}, ${state}, India`);
    queries.push(`${district} district, ${state}, India`);
    queries.push(`One Stop Centre, ${district}, ${state}, India`);
  }

  if (district) {
    queries.push(`${district}, India`);
  }

  if (state) {
    queries.push(`${state}, India`);
  }

  for (const segment of segments.slice(-4).reverse()) {
    if (district && state) {
      queries.push(`${segment}, ${district}, ${state}, India`);
    }
    if (state) {
      queries.push(`${segment}, ${state}, India`);
    }
  }

  if (pinMatch) {
    queries.push(`${pinMatch[1]}, India`);
  }

  if (cleanedAddress) {
    queries.push(`${cleanedAddress}, India`);
  }

  return [...new Set(queries.map((query) => query.replace(/\s+/g, ' ').trim()).filter(Boolean))];
}

async function fetchJsonWithRetry(url: string, attempts = 3): Promise<any> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'application/json',
        },
      });

      if (response.status === 429 || response.status >= 500) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        await sleep(RETRY_DELAY_MS * attempt);
      }
    }
  }

  throw lastError;
}

async function geocodeAddress(query: string) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(query)}`;
  const results = await fetchJsonWithRetry(url);

  if (Array.isArray(results) && results.length > 0) {
    return {
      lat: Number.parseFloat(results[0].lat),
      lng: Number.parseFloat(results[0].lon),
      displayName: results[0].display_name as string,
    };
  }

  return null;
}

async function main() {
  const limit = Number.parseInt(process.env.GEOCODE_LIMIT || '0', 10);

  const services = await prisma.service.findMany({
    where: {
      OR: [{ lat: null }, { lng: null }],
    },
    orderBy: { id: 'asc' },
    ...(limit > 0 ? { take: limit } : {}),
  });

  console.log(`Found ${services.length} services without coordinates.`);

  let successCount = 0;
  let failCount = 0;

  for (let index = 0; index < services.length; index++) {
    const service = services[index];
    const cleanedAddress = cleanAddress(service.address);

    if (!cleanedAddress) {
      console.log(`[${index + 1}/${services.length}] Skipping ID ${service.id} - address is empty after cleanup.`);
      failCount++;
      continue;
    }

    const queries = buildQueries(cleanedAddress);
    let resolved: { lat: number; lng: number; displayName: string } | null = null;

    console.log(`\n[${index + 1}/${services.length}] Service ${service.id}: ${service.name || 'Unnamed service'}`);
    console.log(`Cleaned address: ${cleanedAddress}`);
    console.log(`Queries: ${queries.join(' | ')}`);

    for (const query of queries) {
      try {
        resolved = await geocodeAddress(query);
        await sleep(REQUEST_DELAY_MS);
      } catch (error: any) {
        console.log(`  Query failed for "${query}": ${error?.message || String(error)}`);
        await sleep(REQUEST_DELAY_MS);
        continue;
      }

      if (resolved) {
        break;
      }
    }

    if (!resolved) {
      console.log('  -> No match found.');
      failCount++;
      continue;
    }

    await prisma.service.update({
      where: { id: service.id },
      data: {
        lat: resolved.lat,
        lng: resolved.lng,
      },
    });

    console.log(`  -> Saved [${resolved.lat}, ${resolved.lng}] from "${resolved.displayName}"`);
    successCount++;
  }

  const remaining = await prisma.service.count({
    where: {
      OR: [{ lat: null }, { lng: null }],
    },
  });

  console.log('\n--- GEOCODING COMPLETE ---');
  console.log(`Updated this run: ${successCount}`);
  console.log(`Still unresolved: ${remaining}`);
  console.log(`Failures this run: ${failCount}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
