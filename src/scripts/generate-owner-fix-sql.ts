import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

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

async function generateOwnerFixSQL() {
  console.log('Generating SQL to fix ownership and territories...\n');

  // 1. Fetch all users from Supabase
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, email, username');

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  // Create user mapping
  const userMap = new Map<string, string>();
  users?.forEach(user => {
    const username = user.username || user.email?.split('@')[0] || '';
    if (username) {
      userMap.set(username.toLowerCase(), user.id);
      // Also map the exact case
      if (user.username) {
        userMap.set(user.username, user.id);
      }
    }
  });

  // 2. Fetch external API data
  console.log('Fetching external API data...');
  const response = await fetch(`${EXTERNAL_API_URL}/submissions?limit=2000`);
  const externalData = await response.json() as any;
  
  // Create mapping of organization name to username
  const orgToUsername = new Map<string, string>();
  externalData.data?.forEach((sub: any) => {
    if (sub.ownerName && sub.username) {
      orgToUsername.set(sub.ownerName, sub.username);
    }
  });

  console.log(`Found ${orgToUsername.size} organization-to-username mappings\n`);

  // 3. Generate SQL file
  let sql = `-- Auto-generated SQL to fix ownership and territories
-- Generated on ${new Date().toISOString()}
-- Based on external API data analysis

-- Create temporary tables
CREATE TEMP TABLE IF NOT EXISTS username_mapping (
    username TEXT PRIMARY KEY,
    user_id UUID NOT NULL,
    default_territory TEXT
);

CREATE TEMP TABLE IF NOT EXISTS org_owner_mapping (
    organization_name TEXT PRIMARY KEY,
    username TEXT NOT NULL
);

-- Insert user mappings
INSERT INTO username_mapping (username, user_id, default_territory) VALUES
`;

  // Add user mappings
  const userMappings: string[] = [];
  users?.forEach(user => {
    const username = user.username || user.email?.split('@')[0] || '';
    const territory = TERRITORY_MAP[username] || TERRITORY_MAP[username.toLowerCase()] || 'Kingston';
    if (username) {
      userMappings.push(`    ('${username}', '${user.id}', '${territory}')`);
    }
  });
  sql += userMappings.join(',\n') + ';\n\n';

  // Add organization mappings
  sql += '-- Insert organization-to-username mappings from external API\nINSERT INTO org_owner_mapping (organization_name, username) VALUES\n';
  
  const orgMappings: string[] = [];
  let count = 0;
  orgToUsername.forEach((username, orgName) => {
    // Escape single quotes in organization names
    const escapedOrgName = orgName.replace(/'/g, "''");
    orgMappings.push(`    ('${escapedOrgName}', '${username}')`);
    count++;
    // Limit to prevent SQL from being too large
    if (count >= 1000) return;
  });
  sql += orgMappings.join(',\n') + ';\n\n';

  // Add the update queries
  sql += `-- Update deals with missing owners
WITH matched_deals AS (
    SELECT 
        d.id as deal_id,
        um.user_id,
        um.default_territory
    FROM deals d
    LEFT JOIN organizations o ON d.organization_id = o.id
    JOIN org_owner_mapping om ON (
        om.organization_name = d.name 
        OR om.organization_name = o.name
    )
    JOIN username_mapping um ON um.username = om.username
    WHERE d.owner_id IS NULL
)
UPDATE deals d
SET 
    owner_id = md.user_id,
    created_by_id = COALESCE(d.created_by_id, md.user_id),
    updated_at = NOW()
FROM matched_deals md
WHERE d.id = md.deal_id;

-- Update organizations with missing territories
WITH org_updates AS (
    SELECT DISTINCT
        o.id as org_id,
        um.default_territory
    FROM organizations o
    JOIN deals d ON d.organization_id = o.id
    JOIN username_mapping um ON d.owner_id = um.user_id
    WHERE o.state_province IS NULL OR o.state_province = ''
)
UPDATE organizations o
SET 
    state_province = ou.default_territory,
    updated_at = NOW()
FROM org_updates ou
WHERE o.id = ou.org_id;

-- Additional update for organizations based on name matching
UPDATE organizations o
SET 
    state_province = um.default_territory,
    updated_at = NOW()
FROM org_owner_mapping om
JOIN username_mapping um ON um.username = om.username
WHERE 
    o.name = om.organization_name
    AND (o.state_province IS NULL OR o.state_province = '');

-- Report results
DO $$
DECLARE
    updated_deals INT;
    updated_orgs INT;
    remaining_deals INT;
    remaining_orgs INT;
BEGIN
    GET DIAGNOSTICS updated_deals = ROW_COUNT;
    
    SELECT COUNT(*) INTO remaining_deals FROM deals WHERE owner_id IS NULL;
    SELECT COUNT(*) INTO remaining_orgs FROM organizations WHERE state_province IS NULL OR state_province = '';
    
    RAISE NOTICE 'Update complete:';
    RAISE NOTICE '  Deals still without owners: %', remaining_deals;
    RAISE NOTICE '  Organizations still without territories: %', remaining_orgs;
END $$;

-- Clean up
DROP TABLE IF EXISTS username_mapping;
DROP TABLE IF EXISTS org_owner_mapping;
`;

  // Write SQL file
  const outputPath = path.join(process.cwd(), 'supabase/migrations/20240730_fix_owners_and_territories_generated.sql');
  fs.writeFileSync(outputPath, sql);
  
  console.log(`SQL migration generated: ${outputPath}`);
  console.log(`\nMigration will update:`);
  console.log(`  - ${orgToUsername.size} organization mappings`);
  console.log(`  - ${users?.length || 0} user mappings`);
  console.log(`\nTo apply this migration, run:`);
  console.log(`  supabase db push`);
}

generateOwnerFixSQL().catch(console.error);