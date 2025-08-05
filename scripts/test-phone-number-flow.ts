#!/usr/bin/env tsx

/**
 * Script to test phone number data flow
 * Run with: npx tsx scripts/test-phone-number-flow.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgsxczfkjbtgzcauxuur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPhoneNumberFlow() {
  console.log('🔍 Testing Phone Number Data Flow\n');

  // Step 1: Get a recent deal with contact
  console.log('1️⃣ Fetching recent deals with contacts...');
  const { data: deals, error: dealsError } = await supabase
    .from('deals')
    .select(`
      id,
      name,
      primary_contact_id,
      organization:organizations!organization_id(name),
      primary_contact:contacts!primary_contact_id(
        id,
        phone_primary,
        first_name,
        last_name
      )
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  if (dealsError) {
    console.error('❌ Error fetching deals:', dealsError);
    return;
  }

  console.log(`✅ Found ${deals?.length || 0} deals\n`);

  // Step 2: Analyze each deal
  for (const deal of deals || []) {
    console.log(`\n📋 Deal: ${deal.name}`);
    console.log(`   Organization: ${(deal.organization as any)?.name || 'N/A'}`);
    console.log(`   Contact ID: ${deal.primary_contact_id || 'None'}`);
    
    if (deal.primary_contact) {
      console.log(`   Contact Name: ${(deal.primary_contact as any).first_name} ${(deal.primary_contact as any).last_name}`);
      console.log(`   Phone Number: ${(deal.primary_contact as any).phone_primary || 'Not provided'}`);
    } else {
      console.log(`   ⚠️  No contact linked to this deal`);
    }
  }

  // Step 3: Check if contacts have phone numbers
  console.log('\n\n2️⃣ Checking contacts with phone numbers...');
  const { data: contactsWithPhones, error: contactsError } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, phone_primary')
    .not('phone_primary', 'is', null)
    .not('phone_primary', 'eq', '')
    .limit(10);

  if (contactsError) {
    console.error('❌ Error fetching contacts:', contactsError);
    return;
  }

  console.log(`✅ Found ${contactsWithPhones?.length || 0} contacts with phone numbers`);
  
  for (const contact of contactsWithPhones || []) {
    console.log(`   ${contact.first_name} ${contact.last_name}: ${contact.phone_primary}`);
  }

  // Step 4: Find deals without contacts
  console.log('\n\n3️⃣ Checking deals without contacts...');
  const { data: dealsWithoutContacts, error: noContactError } = await supabase
    .from('deals')
    .select('id, name, created_at')
    .is('primary_contact_id', null)
    .order('created_at', { ascending: false })
    .limit(5);

  if (noContactError) {
    console.error('❌ Error:', noContactError);
    return;
  }

  console.log(`⚠️  Found ${dealsWithoutContacts?.length || 0} deals without contacts`);
  for (const deal of dealsWithoutContacts || []) {
    console.log(`   ${deal.name} (${new Date(deal.created_at).toLocaleDateString()})`);
  }

  // Step 5: Test the mapDealToSubmission function
  console.log('\n\n4️⃣ Testing data mapping...');
  if (deals && deals.length > 0) {
    const testDeal = deals[0];
    console.log('\nRaw deal data:');
    console.log(JSON.stringify(testDeal, null, 2));
    
    // Import and test the mapping function
    const { mapDealToSubmission } = await import('../src/lib/supabase-api');
    const submission = mapDealToSubmission(testDeal);
    
    console.log('\nMapped submission:');
    console.log({
      ownerName: submission.ownerName,
      phoneNumber: submission.phoneNumber,
      hasContact: !!testDeal.primary_contact,
      contactPhone: (testDeal.primary_contact as any)?.phone_primary
    });
  }
}

// Run the test
testPhoneNumberFlow().catch(console.error);