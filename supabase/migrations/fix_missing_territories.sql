-- Fix missing territories for organizations
-- This script handles cases where organizations exist but don't have territories set

-- First, let's check which deals don't have organizations with territories
SELECT 
  d.id as deal_id,
  d.name as deal_name,
  d.organization_id,
  o.name as org_name,
  o.state_province,
  u.email as owner_email,
  u.username
FROM deals d
LEFT JOIN organizations o ON d.organization_id = o.id
LEFT JOIN users u ON d.owner_id = u.id
WHERE o.state_province IS NULL OR o.state_province = ''
ORDER BY u.username, d.created_at DESC;

-- Update territories based on user email patterns
UPDATE organizations o
SET state_province = CASE 
  -- Map users to territories based on your team structure
  WHEN u.email = 'rogimon@getflash.io' THEN 'St. Ann'
  WHEN u.email = 'tatiana_1@getflash.io' THEN 'Kingston'
  WHEN u.email = 'charms@getflash.io' THEN 'Portland'
  WHEN u.email = 'chala@getflash.io' THEN 'St. Mary'
  WHEN u.email = 'kandi@getflash.io' THEN 'St. Catherine'
  WHEN u.email = 'leah@getflash.io' THEN 'Clarendon'
  WHEN u.email = 'tamoy@getflash.io' THEN 'Manchester'
  WHEN u.email = 'jodi@getflash.io' THEN 'St. Elizabeth'
  WHEN u.email = 'flash@getflash.io' THEN 'Kingston' -- Admin/default
  ELSE 'Kingston' -- Default territory
END
FROM deals d
JOIN users u ON d.owner_id = u.id
WHERE o.id = d.organization_id
  AND (o.state_province IS NULL OR o.state_province = '');

-- For deals without organizations, we need to handle differently
-- Check if there are any deals without organization_id
SELECT 
  d.id,
  d.name,
  d.organization_id,
  u.email as owner_email
FROM deals d
LEFT JOIN users u ON d.owner_id = u.id
WHERE d.organization_id IS NULL;

-- Option 1: Create organizations for deals that don't have them
-- This creates a basic organization record for orphaned deals
INSERT INTO organizations (id, name, created_at, updated_at, state_province)
SELECT 
  gen_random_uuid() as id,
  d.name as name,
  d.created_at,
  NOW() as updated_at,
  CASE 
    WHEN u.email = 'rogimon@getflash.io' THEN 'St. Ann'
    WHEN u.email = 'tatiana_1@getflash.io' THEN 'Kingston'
    WHEN u.email = 'charms@getflash.io' THEN 'Portland'
    WHEN u.email = 'chala@getflash.io' THEN 'St. Mary'
    WHEN u.email = 'kandi@getflash.io' THEN 'St. Catherine'
    WHEN u.email = 'leah@getflash.io' THEN 'Clarendon'
    WHEN u.email = 'tamoy@getflash.io' THEN 'Manchester'
    WHEN u.email = 'jodi@getflash.io' THEN 'St. Elizabeth'
    ELSE 'Kingston'
  END as state_province
FROM deals d
LEFT JOIN users u ON d.owner_id = u.id
WHERE d.organization_id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Option 2: Update deals to link to newly created organizations
-- This would need to be run after Option 1
WITH new_orgs AS (
  SELECT 
    d.id as deal_id,
    o.id as org_id
  FROM deals d
  JOIN organizations o ON o.name = d.name
  WHERE d.organization_id IS NULL
)
UPDATE deals
SET organization_id = new_orgs.org_id
FROM new_orgs
WHERE deals.id = new_orgs.deal_id;

-- Verify the fix
SELECT 
  COUNT(*) as total_deals,
  COUNT(o.state_province) as deals_with_territory,
  COUNT(*) - COUNT(o.state_province) as deals_without_territory
FROM deals d
LEFT JOIN organizations o ON d.organization_id = o.id;

-- Show territory distribution
SELECT 
  COALESCE(o.state_province, 'No Territory') as territory,
  COUNT(*) as deal_count
FROM deals d
LEFT JOIN organizations o ON d.organization_id = o.id
GROUP BY o.state_province
ORDER BY deal_count DESC;