#!/usr/bin/env tsx

/**
 * Test creating a submission with phone number
 * Run with: npx tsx scripts/test-create-submission-with-phone.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgsxczfkjbtgzcauxuur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCreateSubmission() {
  const testData = {
    businessName: 'Test Phone Business ' + Date.now(),
    ownerName: 'John Doe',
    phoneNumber: '876-555-9999',
    email: 'test@example.com'
  };

  console.log('🧪 Creating test submission with phone number\n');
  console.log('Test data:', testData);

  try {
    // Step 1: Create organization
    console.log('\n1️⃣ Creating organization...');
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: testData.businessName,
        state_province: 'Kingston',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orgError) {
      console.error('❌ Organization error:', orgError);
      return;
    }
    console.log('✅ Organization created:', org.id);

    // Step 2: Create contact with phone
    console.log('\n2️⃣ Creating contact with phone...');
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        organization_id: org.id,
        first_name: testData.ownerName.split(' ')[0],
        last_name: testData.ownerName.split(' ')[1] || 'N/A',
        phone_primary: testData.phoneNumber,
        email: testData.email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (contactError) {
      console.error('❌ Contact error:', contactError);
      console.error('Details:', contactError);
      return;
    }
    console.log('✅ Contact created:', contact.id);
    console.log('   Phone:', contact.phone_primary);

    // Step 3: Create deal with contact reference
    console.log('\n3️⃣ Creating deal with contact reference...');
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .insert({
        name: testData.businessName,
        organization_id: org.id,
        primary_contact_id: contact.id,
        interest_level: 4,
        package_seen: true,
        status: 'open',
        stage: 'qualification',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select(`
        id,
        name,
        primary_contact_id,
        primary_contact:contacts!primary_contact_id(
          id,
          phone_primary
        )
      `)
      .single();

    if (dealError) {
      console.error('❌ Deal error:', dealError);
      return;
    }
    console.log('✅ Deal created:', deal.id);
    console.log('   Contact ID in deal:', deal.primary_contact_id);
    console.log('   Phone from contact:', deal.primary_contact?.phone_primary);

    // Clean up
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('deals').delete().eq('id', deal.id);
    await supabase.from('contacts').delete().eq('id', contact.id);
    await supabase.from('organizations').delete().eq('id', org.id);
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testCreateSubmission();