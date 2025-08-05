-- Fix deals table constraint issue
-- Run this in Supabase SQL Editor

-- 1. First, let's see what the constraint looks like
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'deals'::regclass
AND contype = 'c';

-- 2. Drop the problematic constraint
ALTER TABLE deals DROP CONSTRAINT IF EXISTS check_lead_status;

-- 3. Add a more permissive constraint or none at all
-- Option A: Add a constraint with common values including 'new'
ALTER TABLE deals ADD CONSTRAINT check_lead_status 
CHECK (lead_status IN ('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost', 'nurturing'));

-- 4. Also check and fix other potential constraints
-- Check all constraints on deals table
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    cc.check_clause
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'deals'
AND tc.constraint_type = 'CHECK';

-- 5. Ensure the metadata column can accept JSONB
ALTER TABLE deals ALTER COLUMN metadata TYPE JSONB USING metadata::JSONB;

-- 6. Test that we can insert a deal with 'new' lead_status
DO $$
BEGIN
    -- Try to insert a test deal
    INSERT INTO deals (
        name,
        lead_status,
        status,
        stage,
        interest_level,
        package_seen,
        decision_makers,
        specific_needs,
        metadata
    ) VALUES (
        'Test Deal',
        'new',
        'open',
        'initial_contact',
        3,
        false,
        '',
        '',
        '{}'::jsonb
    );
    
    -- If successful, delete the test
    DELETE FROM deals WHERE name = 'Test Deal';
    
    RAISE NOTICE 'Successfully tested deal insertion with lead_status = new';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error testing deal insertion: %', SQLERRM;
END $$;

-- 7. Show current deal columns and their types
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'deals'
AND column_name IN ('name', 'lead_status', 'status', 'stage', 'metadata')
ORDER BY ordinal_position;