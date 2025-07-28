#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('🔍 Simple Supabase Connection Test\n');

async function runTests() {
  // Test 1: Using Anon Key
  console.log('1️⃣ Testing with ANON key...');
  const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

  try {
    const { data: anonData, error: anonError } = await supabaseAnon
    .from('organizations')
    .select('count')
    .limit(1);
  
  if (anonError) {
    console.log('❌ Anon key error:', anonError.message);
  } else {
    console.log('✅ Anon key works!');
    }
  } catch (err) {
    console.log('❌ Anon key exception:', err);
  }

  // Test 2: Using Service Role Key
  console.log('\n2️⃣ Testing with SERVICE ROLE key...');
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    const { data: serviceData, error: serviceError } = await supabaseService
    .from('organizations')
    .select('count')
    .limit(1);
  
    if (serviceError) {
      console.log('❌ Service role error:', serviceError.message);
    } else {
      console.log('✅ Service role works!');
    }
  } catch (err) {
    console.log('❌ Service role exception:', err);
  }

  // Test 3: Try a raw SQL query
  console.log('\n3️⃣ Testing with raw SQL...');
  try {
    const { data: sqlData, error: sqlError } = await supabaseService
      .rpc('get_table_count', { table_name: 'organizations' });
    
    if (sqlError) {
      console.log('❌ RPC error:', sqlError.message);
      
      // Try direct SQL
      const { data: directSql, error: directError } = await supabaseService
        .from('organizations')
        .select('*', { count: 'exact', head: true });
      
      if (directError) {
        console.log('❌ Direct SQL error:', directError.message);
      } else {
        console.log('✅ Direct SQL works! Count:', directSql);
      }
    } else {
      console.log('✅ RPC works!');
    }
  } catch (err) {
    console.log('❌ SQL exception:', err);
  }

  // Test 4: Check auth status
  console.log('\n4️⃣ Checking auth status...');
  const { data: { user }, error: authError } = await supabaseService.auth.getUser();
  console.log('Auth user:', user ? user.email : 'No user (this is normal for service role)');

  console.log('\n📋 Environment check:');
  console.log('- URL valid:', supabaseUrl.includes('supabase.co'));
  console.log('- Anon key length:', supabaseAnonKey?.length || 0);
  console.log('- Service key length:', supabaseServiceKey?.length || 0);
  console.log('- Keys are different:', supabaseAnonKey !== supabaseServiceKey);
}

// Run the tests
runTests().catch(console.error);