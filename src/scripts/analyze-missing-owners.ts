import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const EXTERNAL_API_URL = 'https://flash-intake-form-3xgvo.ondigitalocean.app/api';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Territory mapping for each username
const TERRITORY_MAP: Record<string, string> = {
  'rogimon': 'St. Ann',
  'tatiana_1': 'Kingston',
  'charms': 'Portland',
  'chala': 'St. Mary',
  'kandi': 'St. Catherine',
  'leah': 'Clarendon',
  'tamoy': 'Manchester',
  'jodi': 'St. Elizabeth',
  'flash': 'Kingston'
};

async function analyzeOwnershipIssues() {
  console.log('Analyzing ownership and territory issues...\n');

  // 1. Get all deals without owners
  const { data: dealsWithoutOwners, error: dealsError } = await supabase
    .from('deals')
    .select(`
      id,
      name,
      created_at,
      organization:organizations!organization_id(
        name,
        state_province
      )
    `)
    .is('owner_id', null);

  if (dealsError) {
    console.error('Error fetching deals:', dealsError);
    return;
  }

  console.log(`Found ${dealsWithoutOwners?.length || 0} deals without owners\n`);

  // 2. Get all organizations without territories
  const { data: orgsWithoutTerritories, error: orgsError } = await supabase
    .from('organizations')
    .select('id, name, created_at')
    .or('state_province.is.null,state_province.eq.');

  if (orgsError) {
    console.error('Error fetching organizations:', orgsError);
    return;
  }

  console.log(`Found ${orgsWithoutTerritories?.length || 0} organizations without territories\n`);

  // 3. Get all users for mapping
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, username');

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  console.log('Supabase users:');
  users?.forEach(user => {
    const username = user.username || user.email?.split('@')[0] || 'unknown';
    console.log(`  ${username}: ${user.id}`);
  });

  // 4. Fetch external API data to compare
  console.log('\nFetching external API data for comparison...');
  try {
    const response = await fetch(`${EXTERNAL_API_URL}/submissions?limit=1000`);
    const data = await response.json() as any;
    
    // Group by username
    const externalByUsername = new Map<string, number>();
    data.data?.forEach((sub: any) => {
      const username = sub.username || 'unknown';
      externalByUsername.set(username, (externalByUsername.get(username) || 0) + 1);
    });

    console.log('\nExternal API submissions by username:');
    externalByUsername.forEach((count, username) => {
      console.log(`  ${username}: ${count} submissions`);
    });

    // Check specific organizations
    console.log('\nChecking specific organizations:');
    const specificOrgs = ['SSMC Express Internationsl'];
    
    for (const orgName of specificOrgs) {
      const externalSubmission = data.data?.find((sub: any) => 
        sub.ownerName === orgName
      );
      
      if (externalSubmission) {
        console.log(`\n${orgName}:`);
        console.log(`  External API username: ${externalSubmission.username}`);
        console.log(`  Expected territory: ${TERRITORY_MAP[externalSubmission.username] || 'Unknown'}`);
        
        // Check in Supabase
        const { data: supabaseDeal } = await supabase
          .from('deals')
          .select(`
            *,
            organization:organizations!organization_id(*),
            owner:users!owner_id(*)
          `)
          .eq('name', orgName)
          .single();
        
        if (supabaseDeal) {
          console.log(`  Supabase owner_id: ${supabaseDeal.owner_id || 'NULL'}`);
          console.log(`  Supabase territory: ${supabaseDeal.organization?.state_province || 'NULL'}`);
        }
      }
    }

  } catch (error) {
    console.error('Error fetching external API data:', error);
  }

  // 5. Generate SQL migration plan
  console.log('\n=== MIGRATION PLAN ===');
  console.log('1. Create user mapping from usernames to user IDs');
  console.log('2. Update deals.owner_id based on external API username data');
  console.log('3. Update organizations.state_province based on deal owner territories');
  console.log('4. Set created_by_id where applicable');
  
  console.log('\nUser ID mapping for SQL:');
  users?.forEach(user => {
    const username = user.username || user.email?.split('@')[0] || 'unknown';
    console.log(`  -- '${username}' -> '${user.id}'`);
  });
}

analyzeOwnershipIssues().catch(console.error);