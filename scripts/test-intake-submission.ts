#!/usr/bin/env tsx

/**
 * Script to test intake form submission directly to Supabase
 * Run with: npx tsx scripts/test-intake-submission.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgsxczfkjbtgzcauxuur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testIntakeSubmission() {
  console.log('🧪 Testing intake form submission...\n');

  try {
    // Test data
    const testData = {
      companyName: 'Test Company ' + new Date().getTime(),
      industry: 'fintech',
      estimatedRevenue: 'less_than_50k',
      currentSoftware: 'quickbooks',
      employeeCount: '1-10',
      contactName: 'Test User',
      contactEmail: 'test@example.com',
      contactPhone: '123-456-7890',
      painPoints: ['efficiency', 'compliance'],
      interestedFeatures: ['payment_processing', 'crm'],
      budgetRange: '100-500',
      timelineUrgency: 'next_quarter',
      notes: 'Test submission from script',
      leadSource: 'script_test',
      assignedTo: 'test-user'
    };

    // Step 1: Create or get organization
    console.log('1️⃣ Creating organization...');
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: testData.companyName,
        industry: testData.industry,
        employee_count_range: testData.employeeCount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orgError) {
      console.error('❌ Organization creation failed:', orgError);
      return;
    }
    console.log('✅ Organization created:', org.id);

    // Step 2: Create contact
    console.log('\n2️⃣ Creating contact...');
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .insert({
        organization_id: org.id,
        first_name: testData.contactName.split(' ')[0],
        last_name: testData.contactName.split(' ')[1] || 'N/A',
        email: testData.contactEmail,
        phone_primary: testData.contactPhone,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (contactError) {
      console.error('❌ Contact creation failed:', contactError);
      return;
    }
    console.log('✅ Contact created:', contact.id);

    // Step 3: Create deal
    console.log('\n3️⃣ Creating deal...');
    const { data: deal, error: dealError } = await supabase
      .from('deals')
      .insert({
        organization_id: org.id,
        primary_contact_id: contact.id,
        name: `${testData.companyName} - Initial Deal`,
        stage: 'qualification',
        status: 'open',
        amount: 0,
        currency: 'USD',
        description: `Lead from ${testData.leadSource}. Budget: ${testData.budgetRange}. Timeline: ${testData.timelineUrgency}`,
        specific_needs: testData.notes,
        source: testData.leadSource,
        custom_fields: {
          estimated_revenue: testData.estimatedRevenue,
          current_software: testData.currentSoftware,
          pain_points: testData.painPoints,
          interested_features: testData.interestedFeatures,
          budget_range: testData.budgetRange,
          timeline_urgency: testData.timelineUrgency
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dealError) {
      console.error('❌ Deal creation failed:', dealError);
      return;
    }
    console.log('✅ Deal created:', deal.id);

    console.log('\n🎉 Test submission successful!');
    console.log('Organization:', org.name);
    console.log('Contact:', contact.first_name, contact.last_name);
    console.log('Deal:', deal.name);

    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('deals').delete().eq('id', deal.id);
    await supabase.from('contacts').delete().eq('id', contact.id);
    await supabase.from('organizations').delete().eq('id', org.id);
    console.log('✅ Test data cleaned up');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run test
testIntakeSubmission();