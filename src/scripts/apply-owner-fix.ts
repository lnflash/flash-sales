import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function applyOwnerFix() {
  console.log('Applying owner and territory fixes...\n');

  try {
    // Read the generated SQL file
    const sqlPath = path.join(process.cwd(), 'supabase/migrations/20240730_fix_owners_and_territories_generated.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Since we can't execute raw SQL through the JS client, we'll do it programmatically
    console.log('Fetching external API data for organization mappings...');
    
    // Fetch external API data
    const response = await fetch('https://flash-intake-form-3xgvo.ondigitalocean.app/api/submissions?limit=2000');
    const externalData = await response.json() as any;
    
    // Create mapping of organization name to username
    const orgToUsername = new Map<string, string>();
    externalData.data?.forEach((sub: any) => {
      if (sub.ownerName && sub.username) {
        orgToUsername.set(sub.ownerName, sub.username);
      }
    });

    // Get user mappings
    const { data: users } = await supabase
      .from('users')
      .select('id, email, username');

    const userMap = new Map<string, string>();
    users?.forEach(user => {
      const username = user.username || user.email?.split('@')[0] || '';
      if (username) {
        userMap.set(username.toLowerCase(), user.id);
        if (user.username) {
          userMap.set(user.username, user.id);
        }
      }
    });

    // Territory mapping
    const TERRITORY_MAP: Record<string, string> = {
      'rogimon': 'St. Ann',
      'tatiana_1': 'Kingston',
      'Tatiana_1': 'Kingston', 
      'charms': 'Portland',
      'chala': 'St. Mary',
      'Chala': 'St. Mary',
      'kandi': 'St. Catherine',
      'leah': 'Clarendon',
      'tamoy': 'Manchester',
      'jodi': 'St. Elizabeth',
      'flash': 'Kingston'
    };

    // Update deals with missing owners
    console.log('Updating deals with missing owners...');
    let updatedDeals = 0;
    
    for (const [orgName, username] of orgToUsername) {
      const userId = userMap.get(username) || userMap.get(username.toLowerCase());
      if (!userId) continue;

      // Update deals where name matches or organization name matches
      const { data: deals } = await supabase
        .from('deals')
        .select('id, organization_id')
        .or(`name.eq.${orgName},organization_id.in.(select id from organizations where name = '${orgName.replace(/'/g, "''")}')`)
        .is('owner_id', null);

      for (const deal of deals || []) {
        const { error } = await supabase
          .from('deals')
          .update({
            owner_id: userId,
            created_by_id: userId,
            updated_at: new Date().toISOString()
          })
          .eq('id', deal.id);

        if (!error) {
          updatedDeals++;
        }
      }
    }

    console.log(`Updated ${updatedDeals} deals with owners`);

    // Update organizations with missing territories
    console.log('\nUpdating organizations with missing territories...');
    let updatedOrgs = 0;

    // First, update based on deal owners
    const { data: dealsWithOwners } = await supabase
      .from('deals')
      .select(`
        organization_id,
        owner:users!owner_id(username, email)
      `)
      .not('owner_id', 'is', null)
      .not('organization_id', 'is', null);

    for (const deal of dealsWithOwners || []) {
      if (!deal.owner) continue;
      
      const owner = deal.owner as any;
      const username = owner.username || owner.email?.split('@')[0] || '';
      const territory = TERRITORY_MAP[username] || TERRITORY_MAP[username.toLowerCase()];
      
      if (territory) {
        const { error } = await supabase
          .from('organizations')
          .update({
            state_province: territory,
            updated_at: new Date().toISOString()
          })
          .eq('id', deal.organization_id)
          .or('state_province.is.null,state_province.eq.');

        if (!error) {
          updatedOrgs++;
        }
      }
    }

    // Second, update based on organization name matching
    for (const [orgName, username] of orgToUsername) {
      const territory = TERRITORY_MAP[username] || TERRITORY_MAP[username.toLowerCase()];
      if (!territory) continue;

      const { error } = await supabase
        .from('organizations')
        .update({
          state_province: territory,
          updated_at: new Date().toISOString()
        })
        .eq('name', orgName)
        .or('state_province.is.null,state_province.eq.');

      if (!error) {
        updatedOrgs++;
      }
    }

    console.log(`Updated ${updatedOrgs} organizations with territories`);

    // Final report
    const { count: dealsWithoutOwners } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .is('owner_id', null);

    const { count: orgsWithoutTerritories } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .or('state_province.is.null,state_province.eq.');

    console.log('\n=== FINAL RESULTS ===');
    console.log(`Deals still without owners: ${dealsWithoutOwners || 0}`);
    console.log(`Organizations still without territories: ${orgsWithoutTerritories || 0}`);

  } catch (error) {
    console.error('Error applying fixes:', error);
  }
}

applyOwnerFix().catch(console.error);