#!/usr/bin/env tsx

/**
 * Test creating a deal with contact but without organization
 * Run with: npx tsx scripts/test-form-without-org.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgsxczfkjbtgzcauxuur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWithoutOrg() {
  console.log('🧪 Testing Form Submission WITHOUT Organization\n');

  const timestamp = Date.now();
  const testData = {
    ownerName: 'Jane Smith',
    phoneNumber: '876-555-' + Math.floor(1000 + Math.random() * 9000),
    email: `test${timestamp}@example.com`
  };

  console.log('📋 Test Data:', testData);

  try {
    // Step 1: Create contact WITHOUT organization
    console.log('\n1️⃣ Creating contact without organization...');
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        organization_id: null, // Explicitly null
        first_name: testData.ownerName.split(' ')[0],
        last_name: testData.ownerName.split(' ')[1] || '',
        phone_primary: testData.phoneNumber,
        email: testData.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (contactError) {
      console.error('❌ Contact error:', contactError);
      console.error('This might indicate contacts REQUIRE an organization_id');
      return;
    }
    
    console.log('✅ Contact created without org:', {
      id: contact.id,
      phone: contact.phone_primary,
      email: contact.email,
      orgId: contact.organization_id
    });

    // Step 2: Create deal
    console.log('\n2️⃣ Creating deal with contact but no org...');
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .insert({
        name: 'Business Without Org ' + timestamp,
        organization_id: null,
        primary_contact_id: contact.id,
        interest_level: 3,
        lead_status: 'new',
        specific_needs: 'Testing without organization',
        package_seen: false,
        status: 'open',
        stage: 'initial_contact',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        id,
        name,
        lead_status,
        primary_contact:contacts!primary_contact_id(
          id,
          phone_primary,
          email
        )
      `)
      .single();

    if (dealError) {
      console.error('❌ Deal error:', dealError);
      // Clean up contact if deal creation failed
      await supabase.from('contacts').delete().eq('id', contact.id);
      return;
    }

    console.log('✅ Deal created:', {
      id: deal.id,
      name: deal.name,
      leadStatus: deal.lead_status
    });

    console.log('\n📞 Contact details from deal:', {
      phone: (deal.primary_contact as any)?.phone_primary,
      email: (deal.primary_contact as any)?.email
    });

    // Clean up
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('deals').delete().eq('id', deal.id);
    await supabase.from('contacts').delete().eq('id', contact.id);
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testWithoutOrg();