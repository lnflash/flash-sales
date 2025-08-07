-- Fix lead_status consistency issues for older submissions
-- This script ensures all submissions have valid lead_status values

-- 1. First, let's check what values currently exist
SELECT DISTINCT lead_status, COUNT(*) as count 
FROM submissions 
GROUP BY lead_status 
ORDER BY lead_status;

-- 2. Update any NULL or empty lead_status to 'new'
UPDATE submissions 
SET lead_status = 'new' 
WHERE lead_status IS NULL 
   OR lead_status = '' 
   OR lead_status NOT IN ('new', 'contacted', 'qualified', 'converted', 'lost');

-- 3. Add a check constraint to ensure valid values going forward
-- First drop existing constraint if it exists
ALTER TABLE submissions 
DROP CONSTRAINT IF EXISTS valid_lead_status;

-- Add the constraint
ALTER TABLE submissions 
ADD CONSTRAINT valid_lead_status 
CHECK (lead_status IN ('new', 'contacted', 'qualified', 'converted', 'lost'));

-- 4. Set default value for lead_status
ALTER TABLE submissions 
ALTER COLUMN lead_status SET DEFAULT 'new';

-- 5. Make lead_status NOT NULL (after we've fixed all existing records)
ALTER TABLE submissions 
ALTER COLUMN lead_status SET NOT NULL;

-- 6. Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_lead_status 
ON submissions(lead_status);

-- 7. Update the updated_at timestamp for modified records
UPDATE submissions 
SET updated_at = NOW() 
WHERE lead_status = 'new' 
  AND (updated_at IS NULL OR updated_at < NOW() - INTERVAL '1 minute');

-- 8. Verify the fix
SELECT 
  lead_status,
  COUNT(*) as count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM submissions 
GROUP BY lead_status 
ORDER BY lead_status;

-- 9. Check for any remaining issues
SELECT id, owner_name, lead_status, created_at 
FROM submissions 
WHERE lead_status IS NULL 
   OR lead_status = '' 
   OR lead_status NOT IN ('new', 'contacted', 'qualified', 'converted', 'lost')
LIMIT 10;