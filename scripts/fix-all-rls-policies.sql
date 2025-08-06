-- Comprehensive fix for all RLS policy issues
-- This addresses 406 (Not Acceptable) errors across multiple tables

-- 1. Fix enrichment_cache table
ALTER TABLE enrichment_cache ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies on enrichment_cache
DROP POLICY IF EXISTS "Enable read access for all users" ON enrichment_cache;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON enrichment_cache;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON enrichment_cache;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON enrichment_cache;
DROP POLICY IF EXISTS "Allow anonymous read access" ON enrichment_cache;
DROP POLICY IF EXISTS "Allow authenticated full access" ON enrichment_cache;

-- Create a simple, permissive read policy for enrichment_cache
CREATE POLICY "Allow anonymous read access" 
ON enrichment_cache FOR SELECT 
USING (true);

-- Allow authenticated users full access
CREATE POLICY "Allow authenticated full access" 
ON enrichment_cache FOR ALL 
USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON enrichment_cache TO anon;
GRANT ALL ON enrichment_cache TO authenticated;

-- 2. Fix program_weekly_goals table
ALTER TABLE program_weekly_goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own goals" ON program_weekly_goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON program_weekly_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON program_weekly_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON program_weekly_goals;

-- Create policies for program_weekly_goals
CREATE POLICY "Users can view their own goals" 
ON program_weekly_goals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" 
ON program_weekly_goals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON program_weekly_goals FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON program_weekly_goals FOR DELETE 
USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON program_weekly_goals TO authenticated;

-- 3. Fix program_sync_status table (create if doesn't exist)
-- First check if table exists, if not create it
CREATE TABLE IF NOT EXISTS program_sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    sync_status TEXT DEFAULT 'idle',
    customTypesSynced BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add the missing column if it doesn't exist
ALTER TABLE program_sync_status 
ADD COLUMN IF NOT EXISTS customTypesSynced BOOLEAN DEFAULT false;

-- Enable RLS
ALTER TABLE program_sync_status ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own sync status" ON program_sync_status;
DROP POLICY IF EXISTS "Users can insert their own sync status" ON program_sync_status;
DROP POLICY IF EXISTS "Users can update their own sync status" ON program_sync_status;
DROP POLICY IF EXISTS "Users can delete their own sync status" ON program_sync_status;

-- Create policies
CREATE POLICY "Users can view their own sync status" 
ON program_sync_status FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync status" 
ON program_sync_status FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync status" 
ON program_sync_status FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync status" 
ON program_sync_status FOR DELETE 
USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON program_sync_status TO authenticated;

-- 4. Ensure proper function permissions for auth functions
GRANT EXECUTE ON FUNCTION auth.uid() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION auth.role() TO anon, authenticated;

-- 5. Refresh the schema cache to ensure changes are recognized
NOTIFY pgrst, 'reload schema';