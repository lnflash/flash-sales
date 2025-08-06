-- Force complete schema reload for enrichment_cache
-- This should fix the 406 error by ensuring PostgREST recognizes the policy changes

-- Step 1: Disable RLS temporarily
ALTER TABLE enrichment_cache DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop all policies (they won't exist with RLS disabled, but just to be safe)
DROP POLICY IF EXISTS "Allow all users full access" ON enrichment_cache;
DROP POLICY IF EXISTS "Enable read access for all users" ON enrichment_cache;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON enrichment_cache;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON enrichment_cache;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON enrichment_cache;
DROP POLICY IF EXISTS "Allow anonymous read access" ON enrichment_cache;
DROP POLICY IF EXISTS "Allow authenticated full access" ON enrichment_cache;

-- Step 3: Re-enable RLS
ALTER TABLE enrichment_cache ENABLE ROW LEVEL SECURITY;

-- Step 4: Create a completely permissive policy
CREATE POLICY "Allow all users full access" 
ON enrichment_cache 
FOR ALL 
TO PUBLIC
USING (true)
WITH CHECK (true);

-- Step 5: Grant all permissions explicitly
GRANT ALL PRIVILEGES ON TABLE enrichment_cache TO anon;
GRANT ALL PRIVILEGES ON TABLE enrichment_cache TO authenticated;
GRANT ALL PRIVILEGES ON TABLE enrichment_cache TO service_role;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Step 6: Force PostgREST to reload its schema cache
-- This sends a notification that PostgREST listens for
SELECT pg_notify('pgrst', 'reload schema');

-- Alternative method to force reload
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

-- Step 7: Also ensure the table's columns are accessible
ALTER TABLE enrichment_cache OWNER TO postgres;

-- Step 8: Verify the policy exists
SELECT tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'enrichment_cache';