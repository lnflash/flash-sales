-- Fix lead_status consistency issues in the deals table
-- The app uses 'deals' table to store what the UI calls 'submissions'

-- 1. First, let's check what values currently exist in deals table
SELECT DISTINCT lead_status, COUNT(*) as count 
FROM deals 
GROUP BY lead_status 
ORDER BY lead_status;

-- 2. Check for any NULL or invalid lead_status values
SELECT 
  id,
  name,
  lead_status,
  status,
  created_at
FROM deals
WHERE lead_status IS NULL 
   OR lead_status = '' 
   OR lead_status NOT IN ('new', 'contacted', 'qualified', 'converted', 'lost')
LIMIT 20;

-- 3. Update any NULL or empty lead_status to 'new'
UPDATE deals 
SET lead_status = 'new',
    updated_at = NOW()
WHERE lead_status IS NULL 
   OR lead_status = '' 
   OR lead_status NOT IN ('new', 'contacted', 'qualified', 'converted', 'lost');

-- 4. Check existing constraints on the deals table
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'deals'::regclass
  AND contype = 'c';

-- 5. Drop any existing check constraint on lead_status if it exists
ALTER TABLE deals 
DROP CONSTRAINT IF EXISTS deals_lead_status_check;

ALTER TABLE deals 
DROP CONSTRAINT IF EXISTS valid_lead_status;

-- 6. Add a flexible check constraint that allows NULL
ALTER TABLE deals 
ADD CONSTRAINT deals_lead_status_check 
CHECK (
  lead_status IS NULL OR 
  lead_status IN ('new', 'contacted', 'qualified', 'converted', 'lost')
);

-- 7. Set default value for lead_status
ALTER TABLE deals 
ALTER COLUMN lead_status SET DEFAULT 'new';

-- 8. Create an index for better query performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_deals_lead_status 
ON deals(lead_status);

-- 9. Verify the fix
SELECT 
  'Total Deals' as metric,
  COUNT(*) as count
FROM deals
UNION ALL
SELECT 
  'Deals with valid lead_status',
  COUNT(*)
FROM deals
WHERE lead_status IN ('new', 'contacted', 'qualified', 'converted', 'lost')
UNION ALL
SELECT 
  'Deals with NULL lead_status',
  COUNT(*)
FROM deals
WHERE lead_status IS NULL
UNION ALL
SELECT 
  'Deals with invalid lead_status',
  COUNT(*)
FROM deals
WHERE lead_status IS NOT NULL 
  AND lead_status NOT IN ('new', 'contacted', 'qualified', 'converted', 'lost');

-- 10. Final check - show distribution of lead_status values
SELECT 
  lead_status,
  COUNT(*) as count,
  MIN(created_at) as oldest_record,
  MAX(created_at) as newest_record
FROM deals 
GROUP BY lead_status 
ORDER BY lead_status;