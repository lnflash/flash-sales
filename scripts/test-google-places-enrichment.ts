#!/usr/bin/env npx tsx
import * as dotenv from 'dotenv';
import { resolve } from 'path';
import { enrichCompany, enrichAddress } from '../src/services/data-enrichment';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

async function testGooglePlacesEnrichment() {
  console.log('🧪 Testing Google Places API Integration\n');

  // Check if API key is available
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
  console.log('API Key available:', apiKey ? '✅ Yes' : '❌ No');
  
  if (!apiKey) {
    console.log('\n⚠️  Google Places API key not found in environment variables');
    console.log('The enrichment service will fall back to mock data\n');
  }

  console.log('\n1️⃣ Testing Company Enrichment...');
  
  // Test with real Jamaican businesses
  const testBusinesses = [
    { name: 'Island Grill', location: 'Kingston' },
    { name: 'Juici Patties', location: 'Montego Bay' },
    { name: 'National Commercial Bank', location: 'Kingston' },
    { name: 'Digicel Jamaica', location: 'Kingston' },
    { name: 'Test Business XYZ', location: 'Jamaica' } // This should fall back to mock
  ];

  for (const business of testBusinesses) {
    console.log(`\n📍 Searching for: ${business.name} in ${business.location}`);
    
    try {
      const result = await enrichCompany(business);
      
      if (result.success) {
        console.log(`✅ Success! Source: ${result.source}`);
        console.log('Data retrieved:');
        console.log(`  - Name: ${result.data.name}`);
        console.log(`  - Industry: ${result.data.industry}`);
        if (result.data.location?.address) {
          console.log(`  - Address: ${result.data.location.address}`);
        }
        if (result.data.phone) {
          console.log(`  - Phone: ${result.data.phone}`);
        }
        if (result.data.website) {
          console.log(`  - Website: ${result.data.website}`);
        }
        if (result.data.rating) {
          console.log(`  - Rating: ${result.data.rating} ⭐ (${result.data.totalRatings} reviews)`);
        }
        if (result.data.placeId) {
          console.log(`  - Google Place ID: ${result.data.placeId}`);
        }
      } else {
        console.log(`❌ Failed: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ Error: ${error}`);
    }
  }

  console.log('\n\n2️⃣ Testing Address Enrichment...');
  
  const testAddress = {
    street: '1 Knutsford Boulevard',
    city: 'Kingston',
    state: 'JM',
    country: 'Jamaica'
  };

  console.log(`\n📍 Geocoding address: ${testAddress.street}, ${testAddress.city}`);
  
  try {
    const result = await enrichAddress(testAddress);
    
    if (result.success) {
      console.log(`✅ Success! Source: ${result.source}`);
      console.log('Data retrieved:');
      if (result.data.standardized) {
        console.log(`  - Formatted: ${result.data.standardized.formatted}`);
      }
      if (result.data.coordinates) {
        console.log(`  - Coordinates: ${result.data.coordinates.lat}, ${result.data.coordinates.lng}`);
      }
      if (result.data.placeId) {
        console.log(`  - Place ID: ${result.data.placeId}`);
      }
    } else {
      console.log(`❌ Failed: ${result.error}`);
    }
  } catch (error) {
    console.error(`❌ Error: ${error}`);
  }

  console.log('\n\n✅ Test completed!');
  console.log('\n📝 Summary:');
  console.log('- The enrichment service integrates with Google Places API when the key is available');
  console.log('- Falls back to mock data gracefully when API key is missing or API fails');
  console.log('- Provides business information including address, phone, website, and ratings');
  console.log('- Supports geocoding for address validation and standardization');
  console.log('- Results are cached to minimize API calls');
}

// Run the test
testGooglePlacesEnrichment();