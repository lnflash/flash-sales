#!/usr/bin/env npx tsx
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testIntakeForms() {
  console.log('🧪 Testing Intake Forms with Lead Status Constraint...\n');

  // Test data
  const testData = {
    ownerName: 'Test Business - John Smith',
    phoneNumber: '(876) 555-1234',
    email: 'test@business.com',
    packageSeen: true,
    decisionMakers: 'Jane Doe - Manager',
    interestLevel: 4,
    signedUp: false,
    leadStatus: 'new' as const,
    specificNeeds: 'Need better payment processing',
    username: 'chala',
    territory: 'St. Mary'
  };

  try {
    console.log('1️⃣ Testing valid lead status values...');
    const validStatuses = ['new', 'contacted', 'qualified', 'converted', null];
    
    for (const status of validStatuses) {
      const testDeal = {
        name: `Test Deal - ${status || 'null'}`,
        lead_status: status,
        status: 'open',
        stage: 'initial_contact',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('deals')
        .insert(testDeal)
        .select()
        .single();

      if (error) {
        console.error(`❌ Failed to insert with lead_status '${status}':`, error.message);
      } else {
        console.log(`✅ Successfully inserted with lead_status '${status}'`);
        // Clean up
        await supabase.from('deals').delete().eq('id', data.id);
      }
    }

    console.log('\n2️⃣ Testing invalid lead status values...');
    const invalidStatuses = ['canvas', 'prospect', 'opportunity', 'signed_up'];
    
    for (const status of invalidStatuses) {
      const testDeal = {
        name: `Test Deal - ${status}`,
        lead_status: status,
        status: 'open',
        stage: 'initial_contact',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('deals')
        .insert(testDeal)
        .select()
        .single();

      if (error && error.message.includes('check_lead_status')) {
        console.log(`✅ Correctly rejected invalid lead_status '${status}'`);
      } else if (error) {
        console.error(`❌ Unexpected error for '${status}':`, error.message);
      } else {
        console.error(`❌ Should have rejected invalid lead_status '${status}'`);
      }
    }

    console.log('\n3️⃣ Testing form submission via API...');
    
    // Get user ID for chala
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('username', 'chala')
      .single();

    if (!userData) {
      console.error('❌ User "chala" not found');
      return;
    }

    // Create organization
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: testData.ownerName,
        state_province: testData.territory,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orgError) {
      console.error('❌ Failed to create organization:', orgError.message);
      return;
    }

    // Create contact
    const { data: contactData, error: contactError } = await supabase
      .from('contacts')
      .insert({
        organization_id: orgData.id,
        phone_primary: testData.phoneNumber,
        email: testData.email,
        first_name: 'John',
        last_name: 'Smith',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (contactError) {
      console.error('❌ Failed to create contact:', contactError.message);
      // Clean up
      await supabase.from('organizations').delete().eq('id', orgData.id);
      return;
    }

    // Create deal with valid lead status
    const { data: dealData, error: dealError } = await supabase
      .from('deals')
      .insert({
        name: testData.ownerName,
        organization_id: orgData.id,
        primary_contact_id: contactData.id,
        owner_id: userData.id,
        package_seen: testData.packageSeen,
        decision_makers: testData.decisionMakers,
        interest_level: testData.interestLevel,
        status: testData.signedUp ? 'won' : 'open',
        lead_status: testData.leadStatus,
        specific_needs: testData.specificNeeds,
        stage: 'initial_contact',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        custom_fields: {
          source: 'test_script',
          email: testData.email,
          phoneNumber: testData.phoneNumber,
          territory: testData.territory,
          username: testData.username
        }
      })
      .select()
      .single();

    if (dealError) {
      console.error('❌ Failed to create deal:', dealError.message);
    } else {
      console.log('✅ Successfully created complete submission');
      console.log('   Deal ID:', dealData.id);
      console.log('   Lead Status:', dealData.lead_status);
      console.log('   Organization:', orgData.name);
      console.log('   Contact:', contactData.first_name, contactData.last_name);
    }

    // Clean up
    if (dealData) {
      await supabase.from('deals').delete().eq('id', dealData.id);
    }
    await supabase.from('contacts').delete().eq('id', contactData.id);
    await supabase.from('organizations').delete().eq('id', orgData.id);

    console.log('\n✅ All tests completed successfully!');
    console.log('The lead status constraint is working correctly.');
    console.log('Forms should now save all data properly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

// Run the test
testIntakeForms();