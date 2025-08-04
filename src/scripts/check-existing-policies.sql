-- Check existing policies on all tables
-- This helps identify which policies already exist before applying RLS scripts

-- Show all existing policies
SELECT 
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Show count of policies per table
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as existing_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Check which tables have RLS enabled
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN 'ENABLED ✅'
        ELSE 'DISABLED ❌'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;