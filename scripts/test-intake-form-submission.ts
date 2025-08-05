#!/usr/bin/env tsx

/**
 * Test the exact flow of the intake form submission
 * Run with: npx tsx scripts/test-intake-form-submission.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgsxczfkjbtgzcauxuur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testIntakeFormSubmission() {
  console.log('🧪 Testing Intake Form Submission Flow\n');

  const timestamp = Date.now();
  const formData = {
    businessName: `Test Form Submission ${timestamp}`,
    ownerName: 'Jane Doe',
    phoneNumber: '876-555-1234',
    email: `test${timestamp}@example.com`,
    territory: 'Kingston',
    country: 'Jamaica',
    interestLevel: 4,
    packageSeen: true,
    decisionMakers: 'Owner',
    specificNeeds: 'Need better payment processing',
    signedUp: false
  };

  const metadata = {
    businessName: formData.businessName,
    businessType: 'retail',
    ownerName: formData.ownerName,
    email: formData.email,
    phoneNumber: formData.phoneNumber,
    monthlyRevenue: '50k-100k',
    numberOfEmployees: '6-20',
    yearEstablished: '2020',
    monthlyTransactions: '500',
    averageTicketSize: '75',
    painPoints: ['High fees', 'Slow processing'],
    currentProcessor: 'Square',
    country: formData.country,
    territory: formData.territory,
    submittedAt: new Date().toISOString()
  };

  try {
    // Step 1: Create organization
    console.log('1️⃣ Creating organization...');
    let organizationId = null;
    
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: formData.businessName,
        state_province: formData.territory,
        country: formData.country,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orgError) {
      console.error('❌ Org error:', orgError.message);
    } else {
      organizationId = org.id;
      console.log('✅ Organization created:', organizationId);
    }

    // Step 2: Create contact (even if org failed)
    console.log('\n2️⃣ Creating contact...');
    let contactId = null;
    
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        organization_id: organizationId,
        phone_primary: formData.phoneNumber,
        email: formData.email,
        first_name: formData.ownerName.split(' ')[0],
        last_name: formData.ownerName.split(' ')[1] || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (contactError) {
      console.error('❌ Contact error:', contactError.message);
      console.error('Full error:', contactError);
    } else {
      contactId = contact.id;
      console.log('✅ Contact created:', contactId);
      console.log('   Phone:', contact.phone_primary);
    }

    // Step 3: Create deal (mimicking the form)
    console.log('\n3️⃣ Creating deal...');
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .insert({
        name: formData.businessName || 'Unnamed Business',
        organization_id: organizationId,
        primary_contact_id: contactId,
        package_seen: formData.packageSeen,
        decision_makers: formData.decisionMakers,
        interest_level: formData.interestLevel,
        status: formData.signedUp ? 'won' : 'open',
        lead_status: 'new',
        specific_needs: formData.specificNeeds,
        stage: 'initial_contact',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        custom_fields: metadata
      })
      .select()
      .single();

    if (dealError) {
      console.error('❌ Deal error:', dealError.message);
      console.error('Full error:', dealError);
    } else {
      console.log('✅ Deal created:', deal.id);
      console.log('   Contact ID:', deal.primary_contact_id);
      console.log('   Lead Status:', deal.lead_status);
      console.log('   Custom Fields:', deal.custom_fields ? 'YES' : 'NO');
    }

    // Step 4: Verify the data
    console.log('\n4️⃣ Verifying saved data...');
    if (deal) {
      const { data: verify } = await supabase
        .from('deals')
        .select(`
          *,
          organization:organizations!organization_id(name, state_province),
          primary_contact:contacts!primary_contact_id(phone_primary, email)
        `)
        .eq('id', deal.id)
        .single();

      if (verify) {
        console.log('\nVerification Results:');
        console.log('Deal Name:', verify.name);
        console.log('Lead Status:', verify.lead_status || '❌ NOT SAVED');
        console.log('Organization:', (verify.organization as any)?.name || '❌ NOT LINKED');
        console.log('Contact Phone:', (verify.primary_contact as any)?.phone_primary || '❌ NOT SAVED');
        console.log('Contact Email:', (verify.primary_contact as any)?.email || '❌ NOT SAVED');
        console.log('Custom Fields Phone:', verify.custom_fields?.phoneNumber || '❌ NOT IN CUSTOM FIELDS');
      }

      // Clean up
      console.log('\n🧹 Cleaning up...');
      await supabase.from('deals').delete().eq('id', deal.id);
      if (contactId) await supabase.from('contacts').delete().eq('id', contactId);
      if (organizationId) await supabase.from('organizations').delete().eq('id', organizationId);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testIntakeFormSubmission();