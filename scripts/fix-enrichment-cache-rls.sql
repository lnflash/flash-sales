-- Fix RLS policies for enrichment_cache table
-- This fixes the 406 (Not Acceptable) error when accessing the enrichment_cache table

-- First, check if the table exists and has RLS enabled
ALTER TABLE enrichment_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON enrichment_cache;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON enrichment_cache;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON enrichment_cache;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON enrichment_cache;

-- Create new policies that allow anonymous access for reading
-- This is needed for the Canvas Form to fetch company data
CREATE POLICY "Enable read access for all users" 
ON enrichment_cache FOR SELECT 
USING (true);

-- Allow authenticated users to insert cache entries
CREATE POLICY "Enable insert for authenticated users only" 
ON enrichment_cache FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update cache entries
CREATE POLICY "Enable update for authenticated users only" 
ON enrichment_cache FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete cache entries
CREATE POLICY "Enable delete for authenticated users only" 
ON enrichment_cache FOR DELETE 
USING (auth.role() = 'authenticated');

-- Grant necessary permissions
GRANT SELECT ON enrichment_cache TO anon;
GRANT ALL ON enrichment_cache TO authenticated;