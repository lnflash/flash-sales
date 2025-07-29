-- Update organizations' state_province based on username of the deal owner
-- This assumes usernames are stored in users table (may need to be adjusted based on actual schema)

-- Update for username 'rogimon' -> St. Ann
UPDATE organizations o
SET state_province = 'St. Ann'
FROM deals d
JOIN users u ON d.owner_id = u.id
WHERE o.id = d.organization_id
  AND (u.first_name = 'rogimon');

-- Update for username 'Tatiana_1' -> Kingston  
UPDATE organizations o
SET state_province = 'Kingston'
FROM deals d
JOIN users u ON d.owner_id = u.id
WHERE o.id = d.organization_id
  AND (u.first_name = 'Tatiana_1');

-- Update for username 'charms' -> Portland
UPDATE organizations o
SET state_province = 'Portland'
FROM deals d
JOIN users u ON d.owner_id = u.id
WHERE o.id = d.organization_id
  AND (u.first_name = 'charms');

-- Update for username 'Chala' -> St. Mary
UPDATE organizations o
SET state_province = 'St. Mary'
FROM deals d
JOIN users u ON d.owner_id = u.id
WHERE o.id = d.organization_id
  AND (u.first_name = 'Chala');

-- Alternative approach if username is stored in custom_fields or a username column
-- This can be uncommented and adjusted based on the actual users table structure:
/*
UPDATE organizations o
SET state_province = 
  CASE 
    WHEN u.username = 'rogimon' THEN 'St. Ann'
    WHEN u.username = 'Tatiana_1' THEN 'Kingston'
    WHEN u.username = 'charms' THEN 'Portland'
    WHEN u.username = 'Chala' THEN 'St. Mary'
    ELSE o.state_province
  END
FROM deals d
JOIN users u ON d.owner_id = u.id
WHERE o.id = d.organization_id
  AND u.username IN ('rogimon', 'Tatiana_1', 'charms', 'Chala');
*/

-- Add index on state_province for better query performance
CREATE INDEX IF NOT EXISTS idx_organizations_state_province ON organizations(state_province);

-- Verify the updates
SELECT 
  o.name as organization_name,
  o.state_province as territory,
  u.email as user_email,
  u.first_name,
  u.last_name
FROM organizations o
JOIN deals d ON o.id = d.organization_id
JOIN users u ON d.owner_id = u.id
WHERE o.state_province IN ('St. Ann', 'Kingston', 'Portland', 'St. Mary')
ORDER BY o.state_province, o.name;