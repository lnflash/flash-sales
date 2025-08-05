#!/usr/bin/env tsx

/**
 * Test script to verify form submission fixes
 * Run with: npx tsx scripts/test-form-submission-fix.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgsxczfkjbtgzcauxuur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFormSubmission() {
  console.log('🧪 Testing Form Submission Flow\n');

  const timestamp = Date.now();
  const testData = {
    businessName: `Test Business ${timestamp}`,
    ownerName: 'John Doe',
    phoneNumber: '876-555-' + Math.floor(1000 + Math.random() * 9000),
    email: `test${timestamp}@example.com`,
    territory: 'Kingston',
    country: 'Jamaica',
    interestLevel: 4,
    leadStatus: 'new',
    specificNeeds: 'Need payment processing for retail business'
  };

  console.log('📋 Test Data:', testData);

  try {
    // Step 1: Create organization
    console.log('\n1️⃣ Creating organization...');
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: testData.businessName,
        state_province: testData.territory,
        country: testData.country,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orgError) {
      console.error('❌ Organization error:', orgError);
      // Continue anyway to test contact creation without org
    } else {
      console.log('✅ Organization created:', org?.id);
    }

    // Step 2: Create contact (even if org creation failed)
    console.log('\n2️⃣ Creating contact...');
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        organization_id: org?.id || null, // Allow null org ID
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
      console.error('Details:', contactError);
      return;
    }
    
    console.log('✅ Contact created:', {
      id: contact.id,
      phone: contact.phone_primary,
      email: contact.email
    });

    // Step 3: Create deal
    console.log('\n3️⃣ Creating deal...');
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .insert({
        name: testData.businessName,
        organization_id: org?.id || null,
        primary_contact_id: contact.id,
        interest_level: testData.interestLevel,
        lead_status: testData.leadStatus,
        specific_needs: testData.specificNeeds,
        package_seen: true,
        status: 'open',
        stage: 'initial_contact',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        custom_fields: {
          territory: testData.territory,
          country: testData.country,
          source: 'test_script'
        }
      })
      .select(`
        id,
        name,
        lead_status,
        interest_level,
        primary_contact_id,
        organization_id,
        primary_contact:contacts!primary_contact_id(
          id,
          phone_primary,
          email
        )
      `)
      .single();

    if (dealError) {
      console.error('❌ Deal error:', dealError);
      return;
    }

    console.log('✅ Deal created:', {
      id: deal.id,
      leadStatus: deal.lead_status,
      interestLevel: deal.interest_level,
      contactId: deal.primary_contact_id,
      orgId: deal.organization_id
    });

    console.log('\n📞 Contact details from deal:', {
      contactId: (deal.primary_contact as any)?.id,
      phone: (deal.primary_contact as any)?.phone_primary,
      email: (deal.primary_contact as any)?.email
    });

    // Step 4: Verify the data is saved correctly
    console.log('\n4️⃣ Verifying saved data...');
    const { data: verifyDeal } = await supabase
      .from('deals')
      .select(`
        *,
        organization:organizations!organization_id(name, state_province),
        primary_contact:contacts!primary_contact_id(phone_primary, email, first_name, last_name)
      `)
      .eq('id', deal.id)
      .single();

    if (verifyDeal) {
      console.log('\n✅ Verification successful:');
      console.log('Deal ID:', verifyDeal.id);
      console.log('Lead Status:', verifyDeal.lead_status);
      console.log('Interest Level:', verifyDeal.interest_level);
      console.log('Organization:', (verifyDeal.organization as any)?.name);
      console.log('Contact Name:', `${(verifyDeal.primary_contact as any)?.first_name} ${(verifyDeal.primary_contact as any)?.last_name}`);
      console.log('Phone Number:', (verifyDeal.primary_contact as any)?.phone_primary || '❌ NOT SAVED');
      console.log('Email:', (verifyDeal.primary_contact as any)?.email || '❌ NOT SAVED');
    }

    // Clean up
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('deals').delete().eq('id', deal.id);
    await supabase.from('contacts').delete().eq('id', contact.id);
    if (org?.id) {
      await supabase.from('organizations').delete().eq('id', org.id);
    }
    console.log('✅ Cleanup complete');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testFormSubmission();