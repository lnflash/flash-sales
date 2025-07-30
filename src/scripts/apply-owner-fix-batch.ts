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

async function applyOwnerFixBatch() {
  console.log('Applying owner and territory fixes (batch mode)...\n');

  try {
    // Step 1: Get user mappings
    console.log('Loading user mappings...');
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

    // Step 2: Fetch specific known mappings from our analysis
    console.log('Applying known organization-to-username mappings...');
    
    // These are the key mappings we discovered
    const knownMappings = [
      { orgName: 'SSMC Express Internationsl', username: 'charms' },
      { orgName: 'Caribbean Dream', username: 'charms' },
      { orgName: 'Boston Jerk Centre', username: 'charms' },
      // Add more specific mappings as needed
    ];

    // Step 3: Update deals in batch
    console.log('\nUpdating deals with missing owners...');
    let updatedDeals = 0;

    for (const mapping of knownMappings) {
      const userId = userMap.get(mapping.username) || userMap.get(mapping.username.toLowerCase());
      if (!userId) {
        console.log(`  Warning: No user found for username "${mapping.username}"`);
        continue;
      }

      // Find deals by organization name
      const { data: orgs } = await supabase
        .from('organizations')
        .select('id')
        .eq('name', mapping.orgName);

      if (orgs && orgs.length > 0) {
        const orgId = orgs[0].id;
        
        const { data: deals } = await supabase
          .from('deals')
          .update({
            owner_id: userId,
            created_by_id: userId,
            updated_at: new Date().toISOString()
          })
          .eq('organization_id', orgId)
          .is('owner_id', null)
          .select();

        if (deals) {
          updatedDeals += deals.length;
          console.log(`  Updated ${deals.length} deals for ${mapping.orgName}`);
        }
      }
    }

    // Step 4: Update all organizations with territories based on their deal owners
    console.log('\nUpdating organization territories based on deal owners...');
    
    // Get all deals with owners and organizations
    const { data: dealsWithOwners } = await supabase
      .from('deals')
      .select(`
        organization_id,
        owner:users!owner_id(username, email)
      `)
      .not('owner_id', 'is', null)
      .not('organization_id', 'is', null);

    // Build a map of organization_id to territory
    const orgTerritoryMap = new Map<string, string>();
    
    dealsWithOwners?.forEach(deal => {
      if (deal.owner && deal.organization_id) {
        const owner = deal.owner as any;
        const username = owner.username || owner.email?.split('@')[0] || '';
        const territory = TERRITORY_MAP[username] || TERRITORY_MAP[username.toLowerCase()];
        if (territory) {
          orgTerritoryMap.set(deal.organization_id, territory);
        }
      }
    });

    // Update organizations in batches
    let updatedOrgs = 0;
    const orgIds = Array.from(orgTerritoryMap.keys());
    const batchSize = 50;

    for (let i = 0; i < orgIds.length; i += batchSize) {
      const batch = orgIds.slice(i, i + batchSize);
      
      for (const orgId of batch) {
        const territory = orgTerritoryMap.get(orgId);
        if (territory) {
          const { error } = await supabase
            .from('organizations')
            .update({
              state_province: territory,
              updated_at: new Date().toISOString()
            })
            .eq('id', orgId)
            .or('state_province.is.null,state_province.eq.');

          if (!error) {
            updatedOrgs++;
          }
        }
      }
      
      console.log(`  Processed ${Math.min(i + batchSize, orgIds.length)} of ${orgIds.length} organizations...`);
    }

    // Final report
    console.log('\n=== RESULTS ===');
    console.log(`Updated ${updatedDeals} deals with owners`);
    console.log(`Updated ${updatedOrgs} organizations with territories`);

    // Check remaining
    const { count: dealsWithoutOwners } = await supabase
      .from('deals')
      .select('*', { count: 'exact', head: true })
      .is('owner_id', null);

    const { count: orgsWithoutTerritories } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .or('state_province.is.null,state_province.eq.');

    console.log('\n=== REMAINING ===');
    console.log(`Deals still without owners: ${dealsWithoutOwners || 0}`);
    console.log(`Organizations still without territories: ${orgsWithoutTerritories || 0}`);

  } catch (error) {
    console.error('Error applying fixes:', error);
  }
}

applyOwnerFixBatch().catch(console.error);