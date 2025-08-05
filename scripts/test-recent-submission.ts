#!/usr/bin/env tsx

/**
 * Script to check the most recent submission
 * Run with: npx tsx scripts/test-recent-submission.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgsxczfkjbtgzcauxuur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRecentSubmission() {
  console.log('🔍 Checking Most Recent Submission\n');

  // Get the most recent deal with all related data
  const { data: deal, error } = await supabase
    .from('deals')
    .select(`
      id,
      name,
      primary_contact_id,
      organization_id,
      package_seen,
      decision_makers,
      interest_level,
      status,
      specific_needs,
      created_at,
      organization:organizations!organization_id(
        id,
        name,
        state_province
      ),
      primary_contact:contacts!primary_contact_id(
        id,
        first_name,
        last_name,
        phone_primary,
        email
      ),
      owner:users!owner_id(
        username,
        email
      )
    `)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('❌ Error fetching deal:', error);
    return;
  }

  if (!deal) {
    console.log('No deals found');
    return;
  }

  console.log('📋 Most Recent Submission:\n');
  console.log(`Deal ID: ${deal.id}`);
  console.log(`Deal Name: ${deal.name}`);
  console.log(`Created: ${new Date(deal.created_at).toLocaleString()}`);
  console.log(`Status: ${deal.status}`);
  console.log(`Interest Level: ${deal.interest_level}/5`);
  console.log(`Package Seen: ${deal.package_seen ? 'Yes' : 'No'}`);
  console.log(`Decision Makers: ${deal.decision_makers || 'None'}`);
  console.log(`Specific Needs: ${deal.specific_needs || 'None'}`);
  
  console.log('\n📢 Organization:');
  if (deal.organization) {
    console.log(`  ID: ${deal.organization.id}`);
    console.log(`  Name: ${deal.organization.name}`);
    console.log(`  Territory: ${deal.organization.state_province || 'Not set'}`);
  } else {
    console.log('  ⚠️  No organization linked');
  }

  console.log('\n📞 Contact:');
  if (deal.primary_contact) {
    console.log(`  ID: ${deal.primary_contact.id}`);
    console.log(`  Name: ${deal.primary_contact.first_name} ${deal.primary_contact.last_name}`);
    console.log(`  Phone: ${deal.primary_contact.phone_primary || 'NO PHONE NUMBER'}`);
    console.log(`  Email: ${deal.primary_contact.email || 'No email'}`);
  } else {
    console.log('  ⚠️  No contact linked');
    console.log(`  Primary Contact ID in deal: ${deal.primary_contact_id || 'NULL'}`);
  }

  console.log('\n👤 Assigned To:');
  if (deal.owner) {
    console.log(`  Username: ${deal.owner.username}`);
    console.log(`  Email: ${deal.owner.email}`);
  } else {
    console.log('  Unassigned');
  }

  // Check if there are orphaned contacts
  if (!deal.primary_contact && deal.organization_id) {
    console.log('\n🔍 Checking for orphaned contacts...');
    const { data: contacts, error: contactError } = await supabase
      .from('contacts')
      .select('id, first_name, last_name, phone_primary')
      .eq('organization_id', deal.organization_id);

    if (!contactError && contacts && contacts.length > 0) {
      console.log(`Found ${contacts.length} contact(s) for this organization:`);
      contacts.forEach(c => {
        console.log(`  - ${c.first_name} ${c.last_name}: ${c.phone_primary || 'No phone'}`);
      });
    }
  }
}

// Run the check
checkRecentSubmission().catch(console.error);