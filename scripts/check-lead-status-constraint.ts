#!/usr/bin/env tsx

/**
 * Check the lead_status constraint in the database
 * Run with: npx tsx scripts/check-lead-status-constraint.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgsxczfkjbtgzcauxuur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkLeadStatusConstraint() {
  console.log('🔍 Checking lead_status constraint\n');

  // Try to get constraint info (this might not work due to permissions)
  try {
    const { data: constraints, error } = await supabase
      .from('pg_constraint')
      .select('*')
      .like('conname', '%lead_status%');

    if (error) {
      console.log('Could not query constraints directly (expected)');
    } else if (constraints) {
      console.log('Constraints found:', constraints);
    }
  } catch (err) {
    // Expected to fail
  }

  // Test different lead_status values
  console.log('Testing different lead_status values:\n');
  
  const testValues = [
    'new',
    'canvas', 
    'contacted',
    'prospect',
    'opportunity',
    'signed_up',
    'qualified',
    'converted',
    null,
    undefined,
    ''
  ];

  // First create a test deal without lead_status
  const { data: testDeal, error: createError } = await supabase
    .from('deals')
    .insert({
      name: 'Test Lead Status Deal',
      status: 'open',
      stage: 'initial_contact',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (createError) {
    console.error('Failed to create test deal:', createError);
    return;
  }

  console.log('Created test deal:', testDeal.id);

  // Test each value
  for (const value of testValues) {
    const { error } = await supabase
      .from('deals')
      .update({ lead_status: value })
      .eq('id', testDeal.id);

    if (error) {
      console.log(`❌ '${value}' - FAILED:`, error.message);
    } else {
      console.log(`✅ '${value}' - SUCCESS`);
    }
  }

  // Clean up
  console.log('\n🧹 Cleaning up...');
  await supabase.from('deals').delete().eq('id', testDeal.id);
  console.log('Done');
}

// Run the check
checkLeadStatusConstraint().catch(console.error);