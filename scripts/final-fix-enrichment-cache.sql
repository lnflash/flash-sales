-- Final comprehensive fix for enrichment_cache 406 errors
-- Run this script in your Supabase SQL Editor

-- 1. First, completely disable RLS to reset everything
ALTER TABLE enrichment_cache DISABLE ROW LEVEL SECURITY;

-- 2. Drop ALL existing policies to start fresh
DO $$ 
BEGIN
    -- Drop all policies on enrichment_cache
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'enrichment_cache') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON enrichment_cache';
    END LOOP;
END $$;

-- 3. Re-enable RLS
ALTER TABLE enrichment_cache ENABLE ROW LEVEL SECURITY;

-- 4. Create a single, completely permissive policy for all operations
CREATE POLICY "unrestricted_access" 
ON enrichment_cache 
AS PERMISSIVE 
FOR ALL 
TO PUBLIC 
USING (true) 
WITH CHECK (true);

-- 5. Grant full permissions to all roles
GRANT ALL ON TABLE enrichment_cache TO anon;
GRANT ALL ON TABLE enrichment_cache TO authenticated;
GRANT ALL ON TABLE enrichment_cache TO service_role;
GRANT ALL ON TABLE enrichment_cache TO postgres;

-- 6. Ensure the schema is accessible
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 7. Force PostgREST to reload everything
SELECT pg_notify('pgrst', 'reload schema');
SELECT pg_notify('pgrst', 'reload config');

-- 8. Verify the policy was created
SELECT 
    'Policy created successfully' as status,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'enrichment_cache';

-- 9. Test that the table is accessible
SELECT 'Testing table access...' as status;
SELECT COUNT(*) as record_count FROM enrichment_cache;