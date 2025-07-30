import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixMissingSubmission() {
  console.log('Fixing missing submission...\n');
  
  // The missing submission data
  const missingSubmission = {
    id: 803,
    ownerName: "test",
    phoneNumber: "6877777888",
    packageSeen: false,
    interestLevel: 3,
    signedUp: false,
    timestamp: "2025-07-30T01:23:05.836Z",
    username: "flash"
  };
  
  console.log('Missing submission:', missingSubmission);
  
  try {
    // 1. Create or find organization
    let organizationId = null;
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('name', missingSubmission.ownerName)
      .single();
    
    if (existingOrg) {
      organizationId = existingOrg.id;
      console.log('Found existing organization:', organizationId);
    } else {
      const { data: newOrg, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: missingSubmission.ownerName,
          state_province: 'Kingston', // Default territory for flash user
          created_at: missingSubmission.timestamp,
          updated_at: missingSubmission.timestamp
        })
        .select()
        .single();
      
      if (orgError) throw orgError;
      organizationId = newOrg.id;
      console.log('Created new organization:', organizationId);
    }
    
    // 2. Create contact
    let contactId = null;
    if (missingSubmission.phoneNumber) {
      const { data: newContact, error: contactError } = await supabase
        .from('contacts')
        .insert({
          organization_id: organizationId,
          phone_primary: missingSubmission.phoneNumber,
          created_at: missingSubmission.timestamp,
          updated_at: missingSubmission.timestamp
        })
        .select()
        .single();
      
      if (!contactError && newContact) {
        contactId = newContact.id;
        console.log('Created new contact:', contactId);
      }
    }
    
    // 3. Get user ID
    let ownerId = null;
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .or(`username.eq.${missingSubmission.username},email.eq.${missingSubmission.username}@getflash.io`)
      .single();
    
    if (user) {
      ownerId = user.id;
      console.log('Found user:', ownerId);
    }
    
    // 4. Create deal with specific ID to match external
    const { data: newDeal, error: dealError } = await supabase
      .from('deals')
      .insert({
        name: missingSubmission.ownerName,
        organization_id: organizationId,
        primary_contact_id: contactId,
        owner_id: ownerId,
        package_seen: missingSubmission.packageSeen,
        interest_level: missingSubmission.interestLevel,
        status: missingSubmission.signedUp ? 'won' : 'open',
        stage: 'initial_contact',
        created_at: missingSubmission.timestamp,
        updated_at: missingSubmission.timestamp,
        // Store external ID in custom_fields for reference
        custom_fields: { external_id: missingSubmission.id }
      })
      .select()
      .single();
    
    if (dealError) throw dealError;
    
    console.log('\n✅ Successfully created missing deal:', newDeal.id);
    console.log('Deal details:', {
      name: newDeal.name,
      organization_id: newDeal.organization_id,
      contact_id: newDeal.primary_contact_id,
      owner_id: newDeal.owner_id
    });
    
  } catch (error) {
    console.error('❌ Error creating missing submission:', error);
  }
}

fixMissingSubmission().catch(console.error);