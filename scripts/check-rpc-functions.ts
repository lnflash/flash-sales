#!/usr/bin/env tsx

/**
 * Check if RPC functions exist and are accessible
 * Run with: npx tsx scripts/check-rpc-functions.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgsxczfkjbtgzcauxuur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRPCFunctions() {
  console.log('🔍 Checking RPC Functions\n');

  // Test update_organization_safe
  console.log('1️⃣ Testing update_organization_safe...');
  try {
    // Create a test org first
    const { data: testOrg } = await supabase
      .from('organizations')
      .insert({ name: 'RPC Test Org', created_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .select()
      .single();

    if (testOrg) {
      const { data, error } = await supabase.rpc('update_organization_safe', {
        org_id_param: testOrg.id,
        name_param: 'Updated RPC Test Org',
        state_province_param: 'Kingston',
        country_param: 'Jamaica'
      });

      if (error) {
        console.error('❌ update_organization_safe failed:', error.message);
      } else {
        console.log('✅ update_organization_safe works');
      }

      // Clean up
      await supabase.from('organizations').delete().eq('id', testOrg.id);
    }
  } catch (err) {
    console.error('❌ update_organization_safe error:', err);
  }

  // Test update_contact_safe
  console.log('\n2️⃣ Testing update_contact_safe...');
  try {
    // Create a test contact
    const { data: testContact } = await supabase
      .from('contacts')
      .insert({ 
        first_name: 'Test', 
        last_name: 'Contact', 
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      })
      .select()
      .single();

    if (testContact) {
      const { data, error } = await supabase.rpc('update_contact_safe', {
        contact_id_param: testContact.id,
        phone_primary_param: '876-555-TEST',
        email_param: 'test@rpc.com',
        first_name_param: 'Updated',
        last_name_param: 'Contact'
      });

      if (error) {
        console.error('❌ update_contact_safe failed:', error.message);
      } else {
        console.log('✅ update_contact_safe works');
      }

      // Clean up
      await supabase.from('contacts').delete().eq('id', testContact.id);
    }
  } catch (err) {
    console.error('❌ update_contact_safe error:', err);
  }

  // Test update_deal
  console.log('\n3️⃣ Testing update_deal...');
  try {
    // Create a test deal
    const { data: testDeal } = await supabase
      .from('deals')
      .insert({ 
        name: 'RPC Test Deal',
        status: 'open',
        stage: 'initial_contact',
        created_at: new Date().toISOString(), 
        updated_at: new Date().toISOString() 
      })
      .select()
      .single();

    if (testDeal) {
      const { data, error } = await supabase.rpc('update_deal', {
        deal_id_param: testDeal.id,
        name_param: 'Updated RPC Test Deal',
        organization_id_param: null,
        primary_contact_id_param: null,
        package_seen_param: true,
        decision_makers_param: 'Owner',
        interest_level_param: 4,
        status_param: 'open',
        lead_status_param: 'new',
        specific_needs_param: 'Testing RPC',
        stage_param: 'qualification',
        custom_fields_param: { test: 'data' }
      });

      if (error) {
        console.error('❌ update_deal failed:', error.message);
        console.error('Full error:', error);
      } else {
        console.log('✅ update_deal works');
        console.log('Returned data:', data);
      }

      // Clean up
      await supabase.from('deals').delete().eq('id', testDeal.id);
    }
  } catch (err) {
    console.error('❌ update_deal error:', err);
  }

  // List all available RPC functions
  console.log('\n4️⃣ Checking available RPC functions...');
  try {
    const { data: functions, error } = await supabase
      .from('pg_proc')
      .select('proname')
      .eq('pronamespace', 2200) // public schema
      .like('proname', 'update_%');

    if (error) {
      console.log('Could not list functions (expected on Supabase)');
    } else if (functions) {
      console.log('Available update functions:', functions.map(f => f.proname));
    }
  } catch (err) {
    // This is expected to fail on Supabase
  }
}

// Run the check
checkRPCFunctions().catch(console.error);