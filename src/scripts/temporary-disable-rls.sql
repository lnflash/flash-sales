-- Temporary RLS Disable Script
-- Use this to temporarily disable RLS while debugging
-- WARNING: Only use in development/staging, not production!

-- Option 1: Disable RLS completely (NOT RECOMMENDED for production)
/*
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines DISABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE workflows DISABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_intelligence DISABLE ROW LEVEL SECURITY;
ALTER TABLE migration_status DISABLE ROW LEVEL SECURITY;
*/

-- Option 2: Create permissive "bypass" policies (SAFER)
-- This keeps RLS enabled but makes all data visible to authenticated users

DO $$
DECLARE
    t record;
BEGIN
    -- Loop through all tables with RLS enabled
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND rowsecurity = true
    LOOP
        -- Drop all existing policies
        EXECUTE format('
            DO $inner$
            DECLARE
                pol record;
            BEGIN
                FOR pol IN 
                    SELECT policyname 
                    FROM pg_policies 
                    WHERE schemaname = ''public'' 
                    AND tablename = %L
                LOOP
                    EXECUTE format(''DROP POLICY IF EXISTS %%I ON %I'', pol.policyname);
                END LOOP;
            END $inner$;
        ', t.tablename, t.tablename);
        
        -- Create a single permissive policy
        EXECUTE format('
            CREATE POLICY "temporary_allow_all" ON %I
            FOR ALL TO authenticated
            USING (true)
            WITH CHECK (true)
        ', t.tablename);
        
        RAISE NOTICE 'Created temporary permissive policy for table: %', t.tablename;
    END LOOP;
END $$;

-- Show the result
SELECT 
    t.tablename,
    'ENABLED' as rls_status,
    'temporary_allow_all' as policy,
    'All authenticated users have full access' as description
FROM pg_tables t
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;