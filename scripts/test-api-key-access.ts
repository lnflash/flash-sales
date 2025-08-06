#!/usr/bin/env npx tsx
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

console.log('Testing API Key Access:\n');

console.log('Direct access:');
console.log('- GOOGLE_PLACES_API_KEY:', process.env.GOOGLE_PLACES_API_KEY ? '✅ Found' : '❌ Not found');
console.log('- NEXT_PUBLIC_GOOGLE_PLACES_API_KEY:', process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ? '✅ Found' : '❌ Not found');

// Test a simple Google Places API call
const apiKey = process.env.GOOGLE_PLACES_API_KEY;
if (apiKey) {
  console.log('\nTesting API call...');
  const testUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=Island+Grill+Kingston&key=${apiKey}`;
  
  fetch(testUrl)
    .then(res => res.json())
    .then(data => {
      console.log('API Response status:', data.status);
      if (data.status === 'OK') {
        console.log('✅ API is working!');
        console.log('Found', data.results?.length || 0, 'results');
        if (data.results?.[0]) {
          console.log('First result:', data.results[0].name);
        }
      } else {
        console.log('❌ API error:', data.status, data.error_message);
      }
    })
    .catch(err => {
      console.log('❌ Fetch error:', err.message);
    });
}