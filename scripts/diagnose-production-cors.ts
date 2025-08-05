#!/usr/bin/env tsx

/**
 * Script to diagnose CORS issues in production
 * Run with: npx tsx scripts/diagnose-production-cors.ts
 */

console.log('🔍 Diagnosing Production CORS Issues\n');

const PRODUCTION_URL = 'https://intake.flashapp.me';
const SUPABASE_URL = 'https://pgsxczfkjbtgzcauxuur.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU';

async function testCORSFromProduction() {
  console.log('1️⃣ Testing CORS preflight request from production origin...\n');

  try {
    // Test 1: Preflight request for organizations
    console.log('Testing: OPTIONS request to /rest/v1/organizations');
    const preflightResponse = await fetch(`${SUPABASE_URL}/rest/v1/organizations`, {
      method: 'OPTIONS',
      headers: {
        'Origin': PRODUCTION_URL,
        'Access-Control-Request-Method': 'PATCH',
        'Access-Control-Request-Headers': 'apikey,authorization,content-type,x-client-info',
      },
    });

    console.log('Status:', preflightResponse.status);
    console.log('Headers:');
    const corsHeaders = [
      'access-control-allow-origin',
      'access-control-allow-methods',
      'access-control-allow-headers',
      'access-control-max-age'
    ];
    
    corsHeaders.forEach(header => {
      const value = preflightResponse.headers.get(header);
      console.log(`  ${header}: ${value || 'NOT SET'}`);
    });

    // Test 2: Actual PATCH request
    console.log('\n2️⃣ Testing PATCH request...\n');
    
    const testOrgId = '882db2c5-be33-4a80-9b1b-05ce009f4fe4'; // From the error
    const patchResponse = await fetch(`${SUPABASE_URL}/rest/v1/organizations?id=eq.${testOrgId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${ANON_KEY}`,
        'Origin': PRODUCTION_URL,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        updated_at: new Date().toISOString()
      }),
    });

    console.log('Status:', patchResponse.status);
    console.log('Response Headers:');
    corsHeaders.forEach(header => {
      const value = patchResponse.headers.get(header);
      console.log(`  ${header}: ${value || 'NOT SET'}`);
    });

    if (!patchResponse.ok) {
      const errorText = await patchResponse.text();
      console.log('\nError Response:', errorText);
    }

    // Test 3: Test with different request configurations
    console.log('\n3️⃣ Testing different request configurations...\n');

    // Test without x-client-info header
    console.log('Testing without x-client-info header:');
    const simpleResponse = await fetch(`${SUPABASE_URL}/rest/v1/organizations?id=eq.${testOrgId}`, {
      method: 'GET',
      headers: {
        'apikey': ANON_KEY,
        'Origin': PRODUCTION_URL,
      },
    });
    console.log('  Status:', simpleResponse.status);
    console.log('  CORS Origin:', simpleResponse.headers.get('access-control-allow-origin'));

    // Test 4: Check if issue is specific to PATCH
    console.log('\n4️⃣ Testing different HTTP methods...\n');
    
    const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
    for (const method of methods) {
      try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/organizations`, {
          method: 'OPTIONS',
          headers: {
            'Origin': PRODUCTION_URL,
            'Access-Control-Request-Method': method,
          },
        });
        const allowed = response.headers.get('access-control-allow-methods');
        console.log(`  ${method}: ${allowed?.includes(method) ? '✅ Allowed' : '❌ Not allowed'}`);
      } catch (err) {
        console.log(`  ${method}: ❌ Error`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

async function checkProductionEnvironment() {
  console.log('\n\n5️⃣ Checking production environment...\n');

  // Check if the app is accessible
  try {
    const appResponse = await fetch(PRODUCTION_URL);
    console.log(`Production app (${PRODUCTION_URL}): ${appResponse.ok ? '✅ Accessible' : '❌ Not accessible'}`);
    console.log(`  Status: ${appResponse.status}`);
  } catch (error) {
    console.log(`Production app: ❌ Cannot reach (${error})`);
  }

  // Check if Supabase is accessible
  try {
    const supabaseResponse = await fetch(`${SUPABASE_URL}/rest/v1/`);
    console.log(`\nSupabase API: ${supabaseResponse.ok ? '✅ Accessible' : '❌ Not accessible'}`);
    console.log(`  Status: ${supabaseResponse.status}`);
  } catch (error) {
    console.log(`Supabase API: ❌ Cannot reach (${error})`);
  }
}

async function suggestFixes() {
  console.log('\n\n📋 Suggested Actions:\n');
  
  console.log('1. If CORS headers are missing or incorrect:');
  console.log('   - Go to Supabase Dashboard → Settings → API → CORS Configuration');
  console.log('   - Add these origins:');
  console.log('     • https://intake.flashapp.me');
  console.log('     • https://flash-sales-ibb-prod.ondigitalocean.app');
  console.log('');
  
  console.log('2. If RLS is blocking requests:');
  console.log('   - Check RLS policies for organizations, contacts, and deals tables');
  console.log('   - Ensure policies allow INSERT and UPDATE for anon role');
  console.log('');
  
  console.log('3. If the issue persists:');
  console.log('   - Use the API proxy endpoint: /api/supabase-proxy/[...path]');
  console.log('   - This bypasses CORS by routing through your Next.js backend');
  console.log('');
  
  console.log('4. Environment variables to verify on DigitalOcean:');
  console.log('   - NEXT_PUBLIC_SUPABASE_URL=' + SUPABASE_URL);
  console.log('   - NEXT_PUBLIC_SUPABASE_ANON_KEY=' + ANON_KEY.substring(0, 40) + '...');
}

// Run all tests
(async () => {
  await testCORSFromProduction();
  await checkProductionEnvironment();
  await suggestFixes();
})();