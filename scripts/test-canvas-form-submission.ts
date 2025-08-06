#!/usr/bin/env tsx

/**
 * Test the canvas form submission through the API
 * Run with: npx tsx scripts/test-canvas-form-submission.ts
 */

import { createSubmission } from '../src/lib/api';
import { LeadStatus } from '../src/types/submission';

async function testCanvasFormSubmission() {
  console.log('🧪 Testing Canvas Form Submission\n');

  const timestamp = Date.now();
  const testData = {
    ownerName: `Canvas Test Business ${timestamp}`,
    phoneNumber: '876-555-' + Math.floor(1000 + Math.random() * 9000),
    email: `canvastest${timestamp}@example.com`,
    packageSeen: true,
    decisionMakers: 'Owner, Manager',
    interestLevel: 4,
    signedUp: false,
    leadStatus: 'new' as LeadStatus,
    specificNeeds: 'Testing canvas form submission with all fields',
    username: 'test_user',
    territory: 'Kingston'
  };

  console.log('📋 Test Data:', testData);

  try {
    console.log('\n🚀 Submitting through API...');
    const result = await createSubmission(testData);
    
    console.log('\n✅ Submission created successfully!');
    console.log('Result:', {
      id: result.id,
      ownerName: result.ownerName,
      phoneNumber: result.phoneNumber || '❌ NOT SAVED',
      email: result.email || '❌ NOT SAVED',
      leadStatus: result.leadStatus || '❌ NOT SAVED',
      territory: result.territory || '❌ NOT SAVED'
    });

    // Verify the data was saved correctly
    if (!result.phoneNumber) {
      console.error('\n❌ Phone number was not saved!');
    }
    if (!result.email) {
      console.error('❌ Email was not saved!');
    }
    if (!result.leadStatus) {
      console.error('❌ Lead status was not saved!');
    }

    // Check the database directly
    console.log('\n🔍 Verifying in database...');
    const { createClient } = await import('@supabase/supabase-js');
    const supabaseUrl = 'https://pgsxczfkjbtgzcauxuur.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: dbCheck } = await supabase
      .from('deals')
      .select(`
        *,
        organization:organizations!organization_id(name),
        primary_contact:contacts!primary_contact_id(phone_primary, email)
      `)
      .eq('id', result.id)
      .single();

    if (dbCheck) {
      console.log('\nDatabase verification:');
      console.log('Deal Name:', dbCheck.name);
      console.log('Lead Status:', dbCheck.lead_status || '❌ NOT IN DB');
      console.log('Organization:', (dbCheck.organization as any)?.name || '❌ NO ORG');
      console.log('Contact Phone:', (dbCheck.primary_contact as any)?.phone_primary || '❌ NO PHONE IN CONTACT');
      console.log('Contact Email:', (dbCheck.primary_contact as any)?.email || '❌ NO EMAIL IN CONTACT');
      console.log('Custom Fields:', dbCheck.custom_fields ? '✅ HAS CUSTOM FIELDS' : '❌ NO CUSTOM FIELDS');
      
      if (dbCheck.custom_fields) {
        console.log('\nCustom Fields Content:');
        console.log('- Phone:', dbCheck.custom_fields.phoneNumber || 'NOT FOUND');
        console.log('- Email:', dbCheck.custom_fields.email || 'NOT FOUND');
        console.log('- Territory:', dbCheck.custom_fields.territory || 'NOT FOUND');
        console.log('- Source:', dbCheck.custom_fields.source || 'NOT FOUND');
      }

      // Clean up
      console.log('\n🧹 Cleaning up test data...');
      await supabase.from('deals').delete().eq('id', result.id);
      if (dbCheck.primary_contact_id) {
        await supabase.from('contacts').delete().eq('id', dbCheck.primary_contact_id);
      }
      if (dbCheck.organization_id) {
        await supabase.from('organizations').delete().eq('id', dbCheck.organization_id);
      }
      console.log('✅ Cleanup complete');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the test
testCanvasFormSubmission();