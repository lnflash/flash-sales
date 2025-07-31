-- Populate lead_status field based on existing data
-- This script updates the lead_status field for all deals based on the status and package_seen fields

-- First, let's see what we're about to update (optional - for verification)
SELECT 
    COUNT(*) as total_deals,
    COUNT(CASE WHEN status = 'won' THEN 1 END) as signed_up_count,
    COUNT(CASE WHEN status != 'won' AND package_seen = false THEN 1 END) as canvas_count,
    COUNT(CASE WHEN status != 'won' AND package_seen = true THEN 1 END) as contacted_count,
    COUNT(CASE WHEN lead_status IS NULL THEN 1 END) as null_lead_status_count
FROM deals;

-- Update lead_status for signed up deals (status = 'won')
UPDATE deals 
SET lead_status = 'signed_up',
    updated_at = CURRENT_TIMESTAMP
WHERE status = 'won' 
  AND (lead_status IS NULL OR lead_status != 'signed_up');

-- Update lead_status for canvas deals (not signed up and package not seen)
UPDATE deals 
SET lead_status = 'canvas',
    updated_at = CURRENT_TIMESTAMP
WHERE status != 'won' 
  AND (package_seen = false OR package_seen IS NULL)
  AND (lead_status IS NULL OR lead_status NOT IN ('signed_up', 'canvas'));

-- Update lead_status for contacted deals (not signed up but package seen)
UPDATE deals 
SET lead_status = 'contacted',
    updated_at = CURRENT_TIMESTAMP
WHERE status != 'won' 
  AND package_seen = true
  AND (lead_status IS NULL OR lead_status NOT IN ('signed_up', 'contacted'));

-- Verify the updates
SELECT 
    lead_status,
    COUNT(*) as count,
    COUNT(CASE WHEN status = 'won' THEN 1 END) as signed_up_checkbox,
    COUNT(CASE WHEN package_seen = true THEN 1 END) as package_seen_true,
    COUNT(CASE WHEN package_seen = false OR package_seen IS NULL THEN 1 END) as package_seen_false
FROM deals
GROUP BY lead_status
ORDER BY lead_status;

-- Show a sample of the updated records
SELECT 
    id,
    name,
    status,
    package_seen,
    lead_status,
    updated_at
FROM deals
WHERE lead_status IS NOT NULL
ORDER BY updated_at DESC
LIMIT 20;