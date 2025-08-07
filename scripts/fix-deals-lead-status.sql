-- Fix lead_status issues in deals table
-- This addresses the problem where updating to 'new' fails on some records

-- 1. Check current state of lead_status in deals table
SELECT 
  lead_status,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM deals
GROUP BY lead_status
ORDER BY lead_status;

-- 2. Check if there's a constraint on lead_status
SELECT 
  conname AS constraint_name,
  pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'deals'::regclass
  AND contype = 'c';

-- 3. Drop any existing check constraint on lead_status
ALTER TABLE deals 
DROP CONSTRAINT IF EXISTS deals_lead_status_check;

-- 4. Update any NULL or invalid lead_status values
UPDATE deals
SET 
  lead_status = CASE
    WHEN lead_status IS NULL THEN 'new'
    WHEN lead_status = '' THEN 'new'
    WHEN lead_status NOT IN ('new', 'contacted', 'qualified', 'converted', 'lost') THEN 'new'
    ELSE lead_status
  END,
  updated_at = NOW()
WHERE lead_status IS NULL 
   OR lead_status = ''
   OR lead_status NOT IN ('new', 'contacted', 'qualified', 'converted', 'lost');

-- 5. Add a more flexible check constraint
ALTER TABLE deals
ADD CONSTRAINT deals_lead_status_check 
CHECK (
  lead_status IS NULL OR 
  lead_status IN ('new', 'contacted', 'qualified', 'converted', 'lost')
);

-- 6. Set default value for lead_status
ALTER TABLE deals
ALTER COLUMN lead_status SET DEFAULT 'new';

-- 7. Create or replace a function to validate lead_status on update
CREATE OR REPLACE FUNCTION validate_lead_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If lead_status is being set
  IF NEW.lead_status IS NOT NULL THEN
    -- Ensure it's a valid value
    IF NEW.lead_status NOT IN ('new', 'contacted', 'qualified', 'converted', 'lost') THEN
      -- Default to 'new' if invalid
      NEW.lead_status := 'new';
      RAISE NOTICE 'Invalid lead_status value "%" changed to "new"', NEW.lead_status;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Drop existing trigger if it exists
DROP TRIGGER IF EXISTS validate_lead_status_trigger ON deals;

-- 9. Create trigger to validate lead_status on insert/update
CREATE TRIGGER validate_lead_status_trigger
BEFORE INSERT OR UPDATE ON deals
FOR EACH ROW
EXECUTE FUNCTION validate_lead_status();

-- 10. Test the fix by trying to update a record
-- This should now work without errors
DO $$
DECLARE
  test_id INTEGER;
BEGIN
  -- Get a random deal ID for testing
  SELECT id INTO test_id FROM deals LIMIT 1;
  
  IF test_id IS NOT NULL THEN
    -- Try updating to 'new'
    UPDATE deals SET lead_status = 'new' WHERE id = test_id;
    RAISE NOTICE 'Test update to "new" successful for deal ID %', test_id;
    
    -- Try updating to 'contacted'
    UPDATE deals SET lead_status = 'contacted' WHERE id = test_id;
    RAISE NOTICE 'Test update to "contacted" successful for deal ID %', test_id;
    
    -- Restore to 'new'
    UPDATE deals SET lead_status = 'new' WHERE id = test_id;
    RAISE NOTICE 'Test update back to "new" successful for deal ID %', test_id;
  END IF;
END $$;

-- 11. Final verification
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