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

async function executeSQLMigration() {
  console.log('Executing SQL migration to fix owners and territories...\n');

  try {
    // Read the generated SQL file
    const sqlPath = path.join(process.cwd(), 'supabase/migrations/20240730_fix_owners_and_territories_generated.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8');

    // Since Supabase JS doesn't support raw SQL execution, we'll extract the data and apply it programmatically
    // Parse the SQL to extract the mappings
    const userMappings: Array<{username: string, userId: string, territory: string}> = [];
    const orgMappings: Array<{orgName: string, username: string}> = [];

    // Extract user mappings
    const userSection = sqlContent.match(/INSERT INTO username_mapping.*?VALUES\s*([\s\S]*?);/);
    if (userSection) {
      const matches = userSection[1].matchAll(/\('([^']+)',\s*'([^']+)',\s*'([^']+)'\)/g);
      for (const match of matches) {
        userMappings.push({
          username: match[1],
          userId: match[2],
          territory: match[3]
        });
      }
    }

    // Extract org mappings
    const orgSection = sqlContent.match(/INSERT INTO org_owner_mapping.*?VALUES\s*([\s\S]*?);/);
    if (orgSection) {
      const matches = orgSection[1].matchAll(/\('([^']+)',\s*'([^']+)'\)/g);
      for (const match of matches) {
        orgMappings.push({
          orgName: match[1].replace(/''/g, "'"), // Unescape single quotes
          username: match[2]
        });
      }
    }

    console.log(`Found ${userMappings.length} user mappings and ${orgMappings.length} organization mappings\n`);

    // Apply the mappings
    let updatedDeals = 0;
    let updatedOrgs = 0;

    // Update deals with missing owners
    console.log('Updating deals with missing owners...');
    
    // Process in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < orgMappings.length; i += batchSize) {
      const batch = orgMappings.slice(i, i + batchSize);
      
      for (const mapping of batch) {
        const userMapping = userMappings.find(u => u.username === mapping.username);
        if (!userMapping) continue;

        // Find organizations by name
        const { data: orgs } = await supabase
          .from('organizations')
          .select('id')
          .eq('name', mapping.orgName);

        if (orgs && orgs.length > 0) {
          // Update deals for this organization
          const { data: deals } = await supabase
            .from('deals')
            .update({
              owner_id: userMapping.userId,
              created_by_id: userMapping.userId,
              updated_at: new Date().toISOString()
            })
            .eq('organization_id', orgs[0].id)
            .is('owner_id', null)
            .select();

          if (deals && deals.length > 0) {
            updatedDeals += deals.length;
            console.log(`  Updated ${deals.length} deals for ${mapping.orgName}`);
          }

          // Also update the organization's territory
          const { error } = await supabase
            .from('organizations')
            .update({
              state_province: userMapping.territory,
              updated_at: new Date().toISOString()
            })
            .eq('id', orgs[0].id)
            .or('state_province.is.null,state_province.eq.');

          if (!error) {
            updatedOrgs++;
          }
        }
      }
      
      if (i % 50 === 0) {
        console.log(`  Processed ${i} of ${orgMappings.length} mappings...`);
      }
    }

    // Update remaining organizations based on their deals' owners
    console.log('\nUpdating remaining organizations with territories...');
    
    const { data: dealsWithOwners } = await supabase
      .from('deals')
      .select(`
        organization_id,
        owner_id
      `)
      .not('owner_id', 'is', null)
      .not('organization_id', 'is', null);

    const orgOwnerMap = new Map<string, string>();
    dealsWithOwners?.forEach(deal => {
      if (!orgOwnerMap.has(deal.organization_id)) {
        orgOwnerMap.set(deal.organization_id, deal.owner_id);
      }
    });

    for (const [orgId, ownerId] of orgOwnerMap) {
      const userMapping = userMappings.find(u => u.userId === ownerId);
      if (userMapping) {
        const { error } = await supabase
          .from('organizations')
          .update({
            state_province: userMapping.territory,
            updated_at: new Date().toISOString()
          })
          .eq('id', orgId)
          .or('state_province.is.null,state_province.eq.');

        if (!error) {
          updatedOrgs++;
        }
      }
    }

    // Final report
    console.log('\n=== MIGRATION RESULTS ===');
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

    console.log('\n=== FINAL STATUS ===');
    console.log(`Deals still without owners: ${dealsWithoutOwners || 0}`);
    console.log(`Organizations still without territories: ${orgsWithoutTerritories || 0}`);

    if (dealsWithoutOwners || orgsWithoutTerritories) {
      console.log('\nNote: Some records still have missing data. This might be due to:');
      console.log('- Organizations not found in the external API data');
      console.log('- Usernames not matching any Supabase users');
      console.log('- Data created after the external API snapshot');
    }

  } catch (error) {
    console.error('Error executing migration:', error);
  }
}

executeSQLMigration().catch(console.error);