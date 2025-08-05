#!/usr/bin/env tsx

/**
 * Debug script to understand why intake form isn't saving data
 * Run with: npx tsx scripts/debug-intake-form.ts
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pgsxczfkjbtgzcauxuur.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugIntakeForm() {
  console.log('🔍 Debugging Intake Form Issues\n');

  // 1. Check recent deals with no contacts
  console.log('1️⃣ Recent deals without contacts:');
  const { data: dealsNoContact, error: e1 } = await supabase
    .from('deals')
    .select(`
      id,
      name,
      created_at,
      primary_contact_id,
      organization_id,
      custom_fields,
      lead_status,
      owner:users!owner_id(username)
    `)
    .is('primary_contact_id', null)
    .order('created_at', { ascending: false })
    .limit(5);

  if (e1) {
    console.error('Error:', e1);
  } else {
    dealsNoContact?.forEach(deal => {
      console.log(`\n  Deal: ${deal.name}`);
      console.log(`  Created: ${new Date(deal.created_at).toLocaleString()}`);
      console.log(`  Org ID: ${deal.organization_id || 'NONE'}`);
      console.log(`  Lead Status: ${deal.lead_status || 'NOT SET'}`);
      console.log(`  Owner: ${(deal.owner as any)?.username || 'Unassigned'}`);
      if (deal.custom_fields) {
        console.log(`  Phone in custom_fields: ${deal.custom_fields.phoneNumber || 'NOT FOUND'}`);
        console.log(`  Email in custom_fields: ${deal.custom_fields.email || 'NOT FOUND'}`);
      }
    });
  }

  // 2. Check if contacts table has any constraint issues
  console.log('\n\n2️⃣ Testing contact creation with minimal data:');
  const testContact = {
    phone_primary: '876-555-TEST',
    first_name: 'Test',
    last_name: 'Contact',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data: newContact, error: contactError } = await supabase
    .from('contacts')
    .insert(testContact)
    .select()
    .single();

  if (contactError) {
    console.error('❌ Contact creation failed:', contactError.message);
    console.error('Details:', contactError);
  } else {
    console.log('✅ Contact created successfully:', newContact.id);
    // Clean up
    await supabase.from('contacts').delete().eq('id', newContact.id);
  }

  // 3. Check deals with contacts
  console.log('\n\n3️⃣ Recent deals WITH contacts:');
  const { data: dealsWithContact } = await supabase
    .from('deals')
    .select(`
      id,
      name,
      created_at,
      primary_contact:contacts!primary_contact_id(
        id,
        phone_primary,
        email
      ),
      custom_fields,
      lead_status
    `)
    .not('primary_contact_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(3);

  dealsWithContact?.forEach(deal => {
    console.log(`\n  Deal: ${deal.name}`);
    console.log(`  Lead Status: ${deal.lead_status || 'NOT SET'}`);
    console.log(`  Contact Phone: ${(deal.primary_contact as any)?.phone_primary || 'NO PHONE'}`);
    console.log(`  Contact Email: ${(deal.primary_contact as any)?.email || 'NO EMAIL'}`);
  });

  // 4. Check if lead_status column exists on deals table
  console.log('\n\n4️⃣ Checking deals table structure:');
  const { data: tableInfo, error: tableError } = await supabase
    .from('deals')
    .select('*')
    .limit(1);

  if (tableError) {
    console.error('Error checking table:', tableError);
  } else if (tableInfo && tableInfo.length > 0) {
    const sampleDeal = tableInfo[0];
    console.log('Available columns:', Object.keys(sampleDeal));
    console.log('Has lead_status column:', 'lead_status' in sampleDeal);
  }

  // 5. Check for orphaned contacts
  console.log('\n\n5️⃣ Orphaned contacts (no organization):');
  const { data: orphanedContacts } = await supabase
    .from('contacts')
    .select('id, first_name, last_name, phone_primary, created_at')
    .is('organization_id', null)
    .order('created_at', { ascending: false })
    .limit(5);

  orphanedContacts?.forEach(contact => {
    console.log(`  ${contact.first_name} ${contact.last_name}: ${contact.phone_primary || 'NO PHONE'}`);
  });
}

// Run the debug
debugIntakeForm().catch(console.error);