-- Safe fix for deals table constraint issue
-- Run this in Supabase SQL Editor

-- 1. First, see what lead_status values currently exist
SELECT DISTINCT lead_status, COUNT(*) as count
FROM deals
WHERE lead_status IS NOT NULL
GROUP BY lead_status
ORDER BY count DESC;

-- 2. Check what the current constraint allows
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'deals'::regclass
AND contype = 'c'
AND conname = 'check_lead_status';

-- 3. Update any invalid lead_status values to 'contacted'
UPDATE deals
SET lead_status = 'contacted'
WHERE lead_status IS NOT NULL 
AND lead_status NOT IN ('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost', 'nurturing');

-- 4. Now drop and recreate the constraint
ALTER TABLE deals DROP CONSTRAINT IF EXISTS check_lead_status;

-- 5. Add the constraint with both 'new' and 'contacted' as valid values
ALTER TABLE deals ADD CONSTRAINT check_lead_status 
CHECK (lead_status IS NULL OR lead_status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost', 'nurturing'));

-- 6. Verify the constraint was created
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'deals'::regclass
AND contype = 'c'
AND conname = 'check_lead_status';

-- 7. Test insertion with different lead_status values
DO $$
DECLARE
    test_values text[] := ARRAY['new', 'contacted'];
    val text;
BEGIN
    FOREACH val IN ARRAY test_values
    LOOP
        BEGIN
            INSERT INTO deals (
                name,
                lead_status,
                status,
                stage,
                interest_level,
                metadata
            ) VALUES (
                'Test Deal ' || val,
                val,
                'open',
                'initial_contact',
                3,
                '{}'::jsonb
            );
            
            DELETE FROM deals WHERE name = 'Test Deal ' || val;
            
            RAISE NOTICE 'Successfully tested with lead_status = %', val;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Error with lead_status = %: %', val, SQLERRM;
        END;
    END LOOP;
END $$;

-- 8. Show summary
SELECT 
    'Constraint fixed' as status,
    COUNT(*) as total_deals,
    COUNT(DISTINCT lead_status) as unique_lead_statuses
FROM deals;