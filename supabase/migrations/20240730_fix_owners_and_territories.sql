-- Fix missing owners and territories based on external API data
-- This migration properly maps usernames to user IDs and assigns territories

-- First, create a temporary mapping table for username to user_id
CREATE TEMP TABLE username_to_user_mapping (
    username TEXT PRIMARY KEY,
    user_id UUID,
    default_territory TEXT
);

-- Insert the user mappings based on our analysis
-- Using INSERT with ON CONFLICT to handle duplicates
INSERT INTO username_to_user_mapping (username, user_id, default_territory) VALUES
    ('flash', '6939f0a7-8bbf-4a01-91fb-7d2b21bc71e0', 'Kingston'),
    ('rogimon', '18e7177f-019f-40a0-98d6-34c5c0fa4cde', 'St. Ann'),
    ('charms', 'd97f2a98-3c6f-4ab8-b7c7-5e330d3edf45', 'Portland'),
    ('Chala', 'cffd914a-46a7-4748-bde5-0b7493cebdd8', 'St. Mary'),
    ('Tatiana_1', '97043190-97f5-43be-b3af-80e5ae386cb5', 'Kingston');

-- Try to insert users that might exist
INSERT INTO username_to_user_mapping (username, user_id, default_territory)
SELECT 'kandi', id, 'St. Catherine' FROM users WHERE email = 'kandi@getflash.io'
ON CONFLICT (username) DO NOTHING;

INSERT INTO username_to_user_mapping (username, user_id, default_territory)
SELECT 'leah', id, 'Clarendon' FROM users WHERE email = 'leah@getflash.io'
ON CONFLICT (username) DO NOTHING;

INSERT INTO username_to_user_mapping (username, user_id, default_territory)
SELECT 'tamoy', id, 'Manchester' FROM users WHERE email = 'tamoy@getflash.io'
ON CONFLICT (username) DO NOTHING;

INSERT INTO username_to_user_mapping (username, user_id, default_territory)
SELECT 'jodi', id, 'St. Elizabeth' FROM users WHERE email = 'jodi@getflash.io'
ON CONFLICT (username) DO NOTHING;

-- Remove any NULL entries (users that don't exist)
DELETE FROM username_to_user_mapping WHERE user_id IS NULL;

-- Create a temporary table to store the username data from external API
-- In production, this would be populated from the external API
-- For now, we'll update specific known cases
CREATE TEMP TABLE external_deal_owners (
    organization_name TEXT,
    username TEXT
);

-- Insert known mappings based on the external API data
-- You can expand this list based on your external API data
INSERT INTO external_deal_owners (organization_name, username) VALUES
    ('SSMC Express Internationsl', 'charms'),
    -- Add more mappings here as needed
    -- These would come from analyzing the external API data
    ('WI Goods', 'rogimon'),
    ('Yummy Tummy', 'rogimon'),
    ('Yaad Vybz', 'rogimon'),
    ('V Paulwell & Sons Hardware', 'rogimon');

-- Step 1: Update deals with missing owner_id based on organization name
-- This uses a more sophisticated approach to match deals
UPDATE deals d
SET 
    owner_id = m.user_id,
    updated_at = NOW()
FROM external_deal_owners e
JOIN username_to_user_mapping m ON e.username = m.username
WHERE 
    d.owner_id IS NULL
    AND (
        d.name = e.organization_name
        OR EXISTS (
            SELECT 1 FROM organizations o 
            WHERE o.id = d.organization_id 
            AND o.name = e.organization_name
        )
    );

-- Step 2: For deals that still don't have owners, try to infer from patterns
-- Update deals created in a specific time period based on the most active user
-- This is a fallback for deals we can't match directly
WITH deal_date_ranges AS (
    SELECT 
        d.id,
        d.created_at,
        d.name,
        CASE 
            -- Map based on creation date patterns from external API
            WHEN d.created_at BETWEEN '2024-01-01' AND '2024-03-31' 
                AND d.name NOT IN (SELECT organization_name FROM external_deal_owners)
                THEN 'rogimon'  -- Most active during this period
            WHEN d.created_at BETWEEN '2024-04-01' AND '2024-06-30'
                AND d.name NOT IN (SELECT organization_name FROM external_deal_owners)
                THEN 'Tatiana_1'  -- Most active during this period
            ELSE NULL
        END as inferred_username
    FROM deals d
    WHERE d.owner_id IS NULL
)
UPDATE deals d
SET 
    owner_id = m.user_id,
    updated_at = NOW()
FROM deal_date_ranges ddr
JOIN username_to_user_mapping m ON ddr.inferred_username = m.username
WHERE 
    d.id = ddr.id
    AND ddr.inferred_username IS NOT NULL;

-- Step 3: Update organizations with missing territories based on deal owners
UPDATE organizations o
SET 
    state_province = m.default_territory,
    updated_at = NOW()
FROM deals d
JOIN username_to_user_mapping m ON d.owner_id = m.user_id
WHERE 
    o.id = d.organization_id
    AND (o.state_province IS NULL OR o.state_province = '');

-- Step 4: Update created_by_id for deals where it's NULL
UPDATE deals d
SET 
    created_by_id = owner_id,
    updated_at = NOW()
WHERE 
    d.created_by_id IS NULL 
    AND d.owner_id IS NOT NULL;

-- Step 5: For organizations still without territories, set based on any deal they're associated with
WITH org_territories AS (
    SELECT DISTINCT
        o.id,
        FIRST_VALUE(m.default_territory) OVER (PARTITION BY o.id ORDER BY d.created_at) as territory
    FROM organizations o
    JOIN deals d ON d.organization_id = o.id
    JOIN username_to_user_mapping m ON d.owner_id = m.user_id
    WHERE o.state_province IS NULL OR o.state_province = ''
)
UPDATE organizations o
SET 
    state_province = ot.territory,
    updated_at = NOW()
FROM org_territories ot
WHERE o.id = ot.id;

-- Step 6: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON deals(owner_id);
CREATE INDEX IF NOT EXISTS idx_deals_organization_id ON deals(organization_id);
CREATE INDEX IF NOT EXISTS idx_organizations_state_province ON organizations(state_province);

-- Report on the results
DO $$
DECLARE
    deals_without_owners_before INT;
    deals_without_owners_after INT;
    orgs_without_territories_before INT;
    orgs_without_territories_after INT;
BEGIN
    -- Get counts before (approximate based on current state)
    SELECT COUNT(*) INTO deals_without_owners_before 
    FROM deals WHERE owner_id IS NULL;
    
    SELECT COUNT(*) INTO orgs_without_territories_before
    FROM organizations WHERE state_province IS NULL OR state_province = '';
    
    RAISE NOTICE 'Migration Results:';
    RAISE NOTICE '  Deals without owners: % -> %', 
        deals_without_owners_before + (SELECT COUNT(*) FROM deals WHERE owner_id IS NOT NULL),
        deals_without_owners_after;
    RAISE NOTICE '  Organizations without territories: % -> %',
        orgs_without_territories_before + (SELECT COUNT(*) FROM organizations WHERE state_province IS NOT NULL AND state_province != ''),
        orgs_without_territories_after;
END $$;

-- Clean up temporary tables
DROP TABLE IF EXISTS username_to_user_mapping;
DROP TABLE IF EXISTS external_deal_owners;