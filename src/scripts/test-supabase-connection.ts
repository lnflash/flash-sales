#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('Please check your .env.local file');
  process.exit(1);
}

console.log('🔧 Testing Supabase Connection...');
console.log(`📍 URL: ${supabaseUrl}`);
console.log(`🔑 Using ${supabaseServiceKey ? 'Service Role' : 'Anon'} Key\n`);

// Create Supabase client
const supabase = createClient(
  supabaseUrl, 
  supabaseServiceKey || supabaseAnonKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        // This header bypasses RLS when using service role key
        ...(supabaseServiceKey ? { 'apikey': supabaseServiceKey } : {})
      }
    }
  }
);

async function testConnection() {
  try {
    console.log('1️⃣ Testing basic connection...');
    
    // Test 1: Check tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('organizations')
      .select('count')
      .limit(1);
    
    if (tablesError) {
      console.error('❌ Connection failed:', tablesError.message);
      return false;
    }
    
    console.log('✅ Connected to Supabase successfully!\n');
    
    // Test 2: Check table counts
    console.log('2️⃣ Checking table counts...');
    
    const tablesToCheck = [
      'organizations',
      'contacts',
      'users',
      'deals',
      'activities',
      'teams',
      'pipelines'
    ];
    
    for (const table of tablesToCheck) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: Error - ${error.message}`);
      } else {
        console.log(`✅ ${table}: ${count || 0} records`);
      }
    }
    
    // Test 3: Check if default pipeline exists
    console.log('\n3️⃣ Checking default data...');
    
    const { data: pipeline, error: pipelineError } = await supabase
      .from('pipelines')
      .select('*')
      .eq('is_default', true)
      .single();
    
    if (pipeline) {
      console.log('✅ Default pipeline exists:', pipeline.name);
    } else {
      console.log('⚠️  No default pipeline found');
    }
    
    // Test 4: Test insert (create test organization)
    console.log('\n4️⃣ Testing data insertion...');
    
    const testOrg = {
      name: `Test Org ${Date.now()}`,
      status: 'lead',
      lifecycle_stage: 'lead',
      source: 'api_test'
    };
    
    const { data: newOrg, error: insertError } = await supabase
      .from('organizations')
      .insert(testOrg)
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError.message);
    } else {
      console.log('✅ Successfully created organization:', newOrg.name);
      
      // Clean up test data
      const { error: deleteError } = await supabase
        .from('organizations')
        .delete()
        .eq('id', newOrg.id);
      
      if (!deleteError) {
        console.log('✅ Test data cleaned up');
      }
    }
    
    // Test 5: Test real-time subscription
    console.log('\n5️⃣ Testing real-time subscriptions...');
    
    const channel = supabase
      .channel('test-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'organizations' },
        (payload) => {
          console.log('📨 Real-time event received:', payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active');
          
          // Unsubscribe after successful connection
          setTimeout(() => {
            supabase.removeChannel(channel);
            console.log('✅ Real-time subscription closed');
          }, 2000);
        }
      });
    
    // Test 6: Check auth configuration
    console.log('\n6️⃣ Checking auth configuration...');
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('ℹ️  No authenticated user (this is normal for service role)');
    } else if (user) {
      console.log('✅ Authenticated as:', user.email);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Run the tests
testConnection()
  .then((success) => {
    console.log('\n' + '='.repeat(50));
    if (success) {
      console.log('✨ All tests completed successfully!');
      console.log('\n📋 Next steps:');
      console.log('1. Run the migration script: npm run migrate:legacy');
      console.log('2. Generate TypeScript types: npm run supabase:types');
      console.log('3. Start implementing Supabase in your components');
    } else {
      console.log('❌ Some tests failed. Please check the errors above.');
    }
    console.log('='.repeat(50));
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test script failed:', error);
    process.exit(1);
  });