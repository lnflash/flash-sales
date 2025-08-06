#!/usr/bin/env npx tsx
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Set the environment variables before importing the service
process.env.GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '';

console.log('Environment check:');
console.log('- GOOGLE_PLACES_API_KEY:', process.env.GOOGLE_PLACES_API_KEY ? 'Set' : 'Not set');
console.log('- NEXT_PUBLIC_GOOGLE_PLACES_API_KEY:', process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ? 'Set' : 'Not set');

async function testDirectEnrichment() {
  // Dynamic import inside async function
  const { enrichCompany } = await import('../src/services/data-enrichment');
  
  console.log('\n🧪 Testing Direct Google Places Enrichment\n');

  const testBusiness = { name: 'Island Grill', location: 'Kingston' };
  
  console.log(`📍 Searching for: ${testBusiness.name} in ${testBusiness.location}`);
  
  try {
    const result = await enrichCompany(testBusiness);
    
    console.log(`\n✅ Result:`, result);
    
    if (result.success) {
      console.log(`\nSource: ${result.source}`);
      console.log('Data retrieved:', JSON.stringify(result.data, null, 2));
    }
  } catch (error) {
    console.error(`❌ Error:`, error);
  }
}

// Run the test
testDirectEnrichment();