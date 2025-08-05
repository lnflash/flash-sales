-- Fix program_sync_status policy
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on program_sync_status if not already enabled
ALTER TABLE program_sync_status ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing policies
DROP POLICY IF EXISTS "allow_all_for_testing" ON program_sync_status;
DROP POLICY IF EXISTS "allow_anon_access" ON program_sync_status;

-- 3. Create anon access policy
CREATE POLICY "allow_anon_access" ON program_sync_status
FOR ALL TO authenticated, anon
USING (true)
WITH CHECK (true);

-- 4. Verify the fix
SELECT 
    'program_sync_status' as table_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies p 
            WHERE p.tablename = 'program_sync_status' 
            AND p.schemaname = 'public'
            AND 'anon' = ANY(p.roles)
        ) THEN '✅ Has anon policy'
        ELSE '❌ Missing anon policy'
    END as policy_status,
    has_table_privilege('anon', 'public.program_sync_status', 'SELECT') as can_read,
    has_table_privilege('anon', 'public.program_sync_status', 'INSERT') as can_insert,
    has_table_privilege('anon', 'public.program_sync_status', 'UPDATE') as can_update;