-- Fix RLS policies for enrichment_cache to work with anon key

-- Drop existing policies
DROP POLICY IF EXISTS "enrichment_cache_select_policy" ON enrichment_cache;
DROP POLICY IF EXISTS "enrichment_cache_insert_policy" ON enrichment_cache;
DROP POLICY IF EXISTS "enrichment_cache_update_policy" ON enrichment_cache;
DROP POLICY IF EXISTS "enrichment_cache_delete_policy" ON enrichment_cache;

-- Create new policies that allow anon access
-- Allow anyone (including anon) to read cache
CREATE POLICY "enrichment_cache_select_policy" ON enrichment_cache
    FOR SELECT 
    USING (true);  -- No authentication required

-- Allow anyone (including anon) to insert into cache
CREATE POLICY "enrichment_cache_insert_policy" ON enrichment_cache
    FOR INSERT 
    WITH CHECK (true);  -- No authentication required

-- Allow anyone (including anon) to update cache
CREATE POLICY "enrichment_cache_update_policy" ON enrichment_cache
    FOR UPDATE 
    USING (true)
    WITH CHECK (true);  -- No authentication required

-- Allow anyone (including anon) to delete from cache (for cache expiration)
CREATE POLICY "enrichment_cache_delete_policy" ON enrichment_cache
    FOR DELETE 
    USING (true);  -- No authentication required

-- Also fix program_weekly_goals policies
DROP POLICY IF EXISTS "program_weekly_goals_select_policy" ON program_weekly_goals;
DROP POLICY IF EXISTS "program_weekly_goals_insert_policy" ON program_weekly_goals;
DROP POLICY IF EXISTS "program_weekly_goals_update_policy" ON program_weekly_goals;
DROP POLICY IF EXISTS "program_weekly_goals_delete_policy" ON program_weekly_goals;

CREATE POLICY "program_weekly_goals_select_policy" ON program_weekly_goals
    FOR SELECT USING (true);

CREATE POLICY "program_weekly_goals_insert_policy" ON program_weekly_goals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "program_weekly_goals_update_policy" ON program_weekly_goals
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "program_weekly_goals_delete_policy" ON program_weekly_goals
    FOR DELETE USING (true);

-- Also fix program_sync_status policies
DROP POLICY IF EXISTS "program_sync_status_select_policy" ON program_sync_status;
DROP POLICY IF EXISTS "program_sync_status_insert_policy" ON program_sync_status;
DROP POLICY IF EXISTS "program_sync_status_update_policy" ON program_sync_status;
DROP POLICY IF EXISTS "program_sync_status_delete_policy" ON program_sync_status;

CREATE POLICY "program_sync_status_select_policy" ON program_sync_status
    FOR SELECT USING (true);

CREATE POLICY "program_sync_status_insert_policy" ON program_sync_status
    FOR INSERT WITH CHECK (true);

CREATE POLICY "program_sync_status_update_policy" ON program_sync_status
    FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "program_sync_status_delete_policy" ON program_sync_status
    FOR DELETE USING (true);

-- Grant necessary permissions to anon role
GRANT ALL ON enrichment_cache TO anon;
GRANT ALL ON program_weekly_goals TO anon;
GRANT ALL ON program_sync_status TO anon;
GRANT USAGE ON SEQUENCE enrichment_cache_id_seq TO anon;

-- Also fix the column name issue for program_sync_status
-- The error shows it's looking for 'activitiesSynced' with camelCase
-- but the table has 'activities_synced' with snake_case
ALTER TABLE program_sync_status RENAME COLUMN activities_synced TO "activitiesSynced";
EOF < /dev/null