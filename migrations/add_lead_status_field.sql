-- Add lead_status column to deals table
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS lead_status VARCHAR(50);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_deals_lead_status ON deals(lead_status);

-- Migrate existing data based on status
-- Set lead_status to 'signed_up' for won deals
UPDATE deals 
SET lead_status = 'signed_up' 
WHERE status = 'won' AND lead_status IS NULL;

-- Set lead_status based on interest level and other factors for non-won deals
UPDATE deals 
SET lead_status = CASE
    WHEN package_seen = true AND interest_level >= 4 THEN 'opportunity'
    WHEN interest_level >= 3 THEN 'prospect'
    WHEN primary_contact_id IS NOT NULL THEN 'contacted'
    ELSE 'canvas'
END
WHERE status != 'won' AND lead_status IS NULL;

-- Add check constraint to ensure valid lead status values
ALTER TABLE deals
ADD CONSTRAINT check_lead_status CHECK (
    lead_status IN ('canvas', 'contacted', 'prospect', 'opportunity', 'signed_up')
);