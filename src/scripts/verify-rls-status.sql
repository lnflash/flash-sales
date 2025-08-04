-- Verify RLS status on all tables
-- This query shows which tables have RLS enabled and counts their policies

WITH table_rls_status AS (
    SELECT 
        schemaname,
        tablename,
        rowsecurity,
        CASE 
            WHEN rowsecurity THEN 'ENABLED ✅'
            ELSE 'DISABLED ❌'
        END as rls_status
    FROM pg_tables 
    WHERE schemaname = 'public'
),
policy_counts AS (
    SELECT 
        schemaname,
        tablename,
        COUNT(*) as policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    GROUP BY schemaname, tablename
)
SELECT 
    t.tablename,
    t.rls_status,
    COALESCE(p.policy_count, 0) as policy_count,
    CASE 
        WHEN t.rowsecurity AND COALESCE(p.policy_count, 0) > 0 THEN 'SECURED ✅'
        WHEN t.rowsecurity AND COALESCE(p.policy_count, 0) = 0 THEN 'RLS ENABLED BUT NO POLICIES ⚠️'
        ELSE 'NOT SECURED ❌'
    END as security_status
FROM table_rls_status t
LEFT JOIN policy_counts p ON t.tablename = p.tablename
ORDER BY 
    CASE 
        WHEN t.rowsecurity = false THEN 0
        WHEN t.rowsecurity = true AND COALESCE(p.policy_count, 0) = 0 THEN 1
        ELSE 2
    END,
    t.tablename;

-- Check for tables without any policies (potential security risk)
SELECT 
    'Tables with RLS enabled but no policies:' as warning,
    STRING_AGG(tablename, ', ') as tables
FROM pg_tables t
WHERE schemaname = 'public' 
AND rowsecurity = true
AND NOT EXISTS (
    SELECT 1 FROM pg_policies p 
    WHERE p.schemaname = t.schemaname 
    AND p.tablename = t.tablename
)
HAVING STRING_AGG(tablename, ', ') IS NOT NULL;

-- List all policies by table
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