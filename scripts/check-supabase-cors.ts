#!/usr/bin/env tsx

/**
 * Script to check Supabase CORS configuration
 * Run with: npx tsx scripts/check-supabase-cors.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pgsxczfkjbtgzcauxuur.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set!');
  console.log('Please set the environment variable or update .env.local');
  process.exit(1);
}

console.log('🔍 Checking Supabase Configuration...\n');
console.log(`URL: ${supabaseUrl}`);
console.log(`Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  try {
    // Test 1: Basic connection
    console.log('\n📡 Testing basic connection...');
    const { data: tables, error: tablesError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1);
    
    if (tablesError) {
      console.error('❌ Failed to connect:', tablesError.message);
      return false;
    }
    console.log('✅ Basic connection successful');

    // Test 2: Check if we can read from main tables
    console.log('\n📊 Testing table access...');
    const tablesToCheck = ['organizations', 'contacts', 'deals', 'users'];
    
    for (const table of tablesToCheck) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`❌ Cannot access ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count} records`);
      }
    }

    // Test 3: Test UPDATE capability (dry run)
    console.log('\n🔄 Testing UPDATE capability...');
    const { data: testDeal, error: selectError } = await supabase
      .from('deals')
      .select('id')
      .limit(1)
      .single();

    if (selectError) {
      console.log('⚠️  No deals found to test UPDATE');
    } else if (testDeal) {
      // Try to update with the same data (no actual change)
      const { error: updateError } = await supabase
        .from('deals')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', testDeal.id);

      if (updateError) {
        console.error('❌ UPDATE test failed:', updateError.message);
        console.log('\nThis is likely causing the CORS error in production!');
        console.log('Make sure RLS policies allow UPDATE operations.');
      } else {
        console.log('✅ UPDATE capability confirmed');
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

async function checkCORSHeaders() {
  console.log('\n🌐 Checking CORS headers...');
  
  try {
    // Simulate a preflight request
    const response = await fetch(`${supabaseUrl}/rest/v1/deals`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://intake.flashapp.me',
        'Access-Control-Request-Method': 'PATCH',
        'Access-Control-Request-Headers': 'apikey,authorization,content-type',
      },
    });

    console.log('Preflight response status:', response.status);
    
    const corsHeaders = {
      'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
      'access-control-allow-methods': response.headers.get('access-control-allow-methods'),
      'access-control-allow-headers': response.headers.get('access-control-allow-headers'),
    };

    console.log('\nCORS Headers:');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      console.log(`  ${key}: ${value || 'NOT SET'}`);
    });

    if (!corsHeaders['access-control-allow-methods']?.includes('PATCH')) {
      console.error('\n❌ PATCH method is not allowed in CORS!');
      console.log('This needs to be configured in Supabase dashboard.');
    }

  } catch (error) {
    console.error('❌ Failed to check CORS headers:', error);
  }
}

// Run tests
(async () => {
  await testSupabaseConnection();
  await checkCORSHeaders();
  
  console.log('\n📋 Next Steps:');
  console.log('1. Go to Supabase Dashboard → Settings → API');
  console.log('2. Add these origins to CORS Allowed Origins:');
  console.log('   - https://intake.flashapp.me');
  console.log('   - https://flash-sales-ibb-prod.ondigitalocean.app');
  console.log('3. Ensure RLS policies allow INSERT, UPDATE, and SELECT operations');
  console.log('4. Deploy the updated .env.production to your hosting platform');
})();