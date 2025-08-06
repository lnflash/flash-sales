-- Fix enrichment_cache to allow full anonymous access
-- This makes the table behave as if RLS was disabled while keeping it enabled

-- Enable RLS on the table
ALTER TABLE enrichment_cache ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON enrichment_cache;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON enrichment_cache;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON enrichment_cache;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON enrichment_cache;
DROP POLICY IF EXISTS "Allow anonymous read access" ON enrichment_cache;
DROP POLICY IF EXISTS "Allow authenticated full access" ON enrichment_cache;
DROP POLICY IF EXISTS "Allow all users full access" ON enrichment_cache;

-- Create a single permissive policy that allows EVERYTHING for EVERYONE
-- This effectively disables RLS while keeping it technically enabled
CREATE POLICY "Allow all users full access" 
ON enrichment_cache 
FOR ALL 
USING (true)
WITH CHECK (true);

-- Grant full permissions to both anon and authenticated roles
GRANT ALL ON enrichment_cache TO anon;
GRANT ALL ON enrichment_cache TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Ensure the table has proper permissions at the column level
GRANT SELECT, INSERT, UPDATE, DELETE ON enrichment_cache TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON enrichment_cache TO authenticated;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';