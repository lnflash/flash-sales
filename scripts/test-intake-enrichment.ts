#!/usr/bin/env npx tsx
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST
dotenv.config({ path: resolve(__dirname, '../.env.local') });

// Set the environment variables before importing the service
process.env.GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY || '';
process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY || '';

async function testIntakeEnrichment() {
  // Dynamic import inside async function
  const { enrichCompany, enrichPerson, enrichPhoneNumber, enrichAddress } = await import('../src/services/data-enrichment');
  
  console.log('🧪 Testing Intake Form Enrichment Services\n');

  // Test company enrichment
  console.log('1. Testing Company Enrichment');
  console.log('================================');
  const companyResult = await enrichCompany({ 
    name: 'Digicel', 
    location: 'Kingston' 
  });
  console.log('Result:', JSON.stringify(companyResult, null, 2));

  // Test with a different company
  console.log('\n2. Testing Another Company');
  console.log('================================');
  const company2Result = await enrichCompany({ 
    name: 'Grace Kennedy', 
    location: 'Kingston' 
  });
  console.log('Result:', JSON.stringify(company2Result, null, 2));

  // Test person enrichment (should fail without API)
  console.log('\n3. Testing Person Enrichment');
  console.log('================================');
  const personResult = await enrichPerson('john.doe@example.com');
  console.log('Result:', JSON.stringify(personResult, null, 2));

  // Test phone enrichment (should fail without API)
  console.log('\n4. Testing Phone Enrichment');
  console.log('================================');
  const phoneResult = await enrichPhoneNumber('+1876-555-1234');
  console.log('Result:', JSON.stringify(phoneResult, null, 2));

  // Test address enrichment
  console.log('\n5. Testing Address Enrichment');
  console.log('================================');
  const addressResult = await enrichAddress({
    street: '1 Main Street',
    city: 'Kingston',
    state: 'Kingston',
    country: 'Jamaica'
  });
  console.log('Result:', JSON.stringify(addressResult, null, 2));
}

// Run the test
testIntakeEnrichment();