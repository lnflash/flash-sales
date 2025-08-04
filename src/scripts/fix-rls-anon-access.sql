-- Fix RLS for Anonymous (anon) Role Access
-- This ensures that both authenticated and anon roles can access data properly

-- Function to create policies for both authenticated and anon roles
CREATE OR REPLACE FUNCTION create_policy_for_all_roles(
    p_table_name text,
    p_policy_name text,
    p_command text,
    p_using_expr text DEFAULT 'true',
    p_with_check_expr text DEFAULT NULL
) RETURNS void AS $$
DECLARE
    sql_stmt text;
BEGIN
    -- Drop existing policy if it exists
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_policy_name, p_table_name);
    
    -- Create new policy for both authenticated and anon
    sql_stmt := format('CREATE POLICY %I ON %I FOR %s TO authenticated, anon',
        p_policy_name, p_table_name, p_command);
    
    -- Handle different commands correctly
    IF p_command = 'SELECT' THEN
        sql_stmt := sql_stmt || format(' USING (%s)', p_using_expr);
    ELSIF p_command = 'INSERT' THEN
        -- INSERT only uses WITH CHECK
        sql_stmt := sql_stmt || format(' WITH CHECK (%s)', COALESCE(p_with_check_expr, p_using_expr));
    ELSIF p_command IN ('UPDATE', 'DELETE') THEN
        -- UPDATE and DELETE use USING, and UPDATE can also use WITH CHECK
        sql_stmt := sql_stmt || format(' USING (%s)', p_using_expr);
        IF p_command = 'UPDATE' AND p_with_check_expr IS NOT NULL THEN
            sql_stmt := sql_stmt || format(' WITH CHECK (%s)', p_with_check_expr);
        END IF;
    ELSIF p_command = 'ALL' THEN
        -- ALL uses both USING and WITH CHECK
        sql_stmt := sql_stmt || format(' USING (%s)', p_using_expr);
        sql_stmt := sql_stmt || format(' WITH CHECK (%s)', COALESCE(p_with_check_expr, p_using_expr));
    END IF;
    
    EXECUTE sql_stmt;
    RAISE NOTICE 'Created policy % on % for authenticated and anon roles', p_policy_name, p_table_name;
END;
$$ LANGUAGE plpgsql;

-- 1. Fix USERS table policies
SELECT create_policy_for_all_roles('users', 'users_select_all', 'SELECT', 'true');
SELECT create_policy_for_all_roles('users', 'users_insert_all', 'INSERT', 'true', 'true');
SELECT create_policy_for_all_roles('users', 'users_update_all', 'UPDATE', 'true', 'true');
SELECT create_policy_for_all_roles('users', 'users_delete_all', 'DELETE', 'true');

-- 2. Fix DEALS table policies
SELECT create_policy_for_all_roles('deals', 'deals_select_all', 'SELECT', 'true');
SELECT create_policy_for_all_roles('deals', 'deals_insert_all', 'INSERT', 'true', 'true');
SELECT create_policy_for_all_roles('deals', 'deals_update_all', 'UPDATE', 'true', 'true');
SELECT create_policy_for_all_roles('deals', 'deals_delete_all', 'DELETE', 'true');

-- 3. Fix ORGANIZATIONS table policies
SELECT create_policy_for_all_roles('organizations', 'organizations_select_all', 'SELECT', 'true');
SELECT create_policy_for_all_roles('organizations', 'organizations_insert_all', 'INSERT', 'true', 'true');
SELECT create_policy_for_all_roles('organizations', 'organizations_update_all', 'UPDATE', 'true', 'true');
SELECT create_policy_for_all_roles('organizations', 'organizations_delete_all', 'DELETE', 'true');

-- 4. Fix CONTACTS table policies
SELECT create_policy_for_all_roles('contacts', 'contacts_select_all', 'SELECT', 'true');
SELECT create_policy_for_all_roles('contacts', 'contacts_insert_all', 'INSERT', 'true', 'true');
SELECT create_policy_for_all_roles('contacts', 'contacts_update_all', 'UPDATE', 'true', 'true');
SELECT create_policy_for_all_roles('contacts', 'contacts_delete_all', 'DELETE', 'true');

-- 5. Fix ACTIVITIES table policies
SELECT create_policy_for_all_roles('activities', 'activities_select_all', 'SELECT', 'true');
SELECT create_policy_for_all_roles('activities', 'activities_insert_all', 'INSERT', 'true', 'true');
SELECT create_policy_for_all_roles('activities', 'activities_update_all', 'UPDATE', 'true', 'true');
SELECT create_policy_for_all_roles('activities', 'activities_delete_all', 'DELETE', 'true');

-- 6. Fix WORKFLOW_RUNS table policies
SELECT create_policy_for_all_roles('workflow_runs', 'workflow_runs_select_all', 'SELECT', 'true');
SELECT create_policy_for_all_roles('workflow_runs', 'workflow_runs_insert_all', 'INSERT', 'true', 'true');
SELECT create_policy_for_all_roles('workflow_runs', 'workflow_runs_update_all', 'UPDATE', 'true', 'true');
SELECT create_policy_for_all_roles('workflow_runs', 'workflow_runs_delete_all', 'DELETE', 'true');

-- 7. Fix REPORTS table policies
SELECT create_policy_for_all_roles('reports', 'reports_select_all', 'SELECT', 'true');
SELECT create_policy_for_all_roles('reports', 'reports_insert_all', 'INSERT', 'true', 'true');
SELECT create_policy_for_all_roles('reports', 'reports_update_all', 'UPDATE', 'true', 'true');
SELECT create_policy_for_all_roles('reports', 'reports_delete_all', 'DELETE', 'true');

-- 8. Fix TEAMS table policies
SELECT create_policy_for_all_roles('teams', 'teams_select_all', 'SELECT', 'true');
SELECT create_policy_for_all_roles('teams', 'teams_insert_all', 'INSERT', 'true', 'true');
SELECT create_policy_for_all_roles('teams', 'teams_update_all', 'UPDATE', 'true', 'true');
SELECT create_policy_for_all_roles('teams', 'teams_delete_all', 'DELETE', 'true');

-- 9. Fix PIPELINES table policies
SELECT create_policy_for_all_roles('pipelines', 'pipelines_select_all', 'SELECT', 'true');
SELECT create_policy_for_all_roles('pipelines', 'pipelines_insert_all', 'INSERT', 'true', 'true');
SELECT create_policy_for_all_roles('pipelines', 'pipelines_update_all', 'UPDATE', 'true', 'true');
SELECT create_policy_for_all_roles('pipelines', 'pipelines_delete_all', 'DELETE', 'true');

-- 10. Fix LEAD_SCORES table policies
SELECT create_policy_for_all_roles('lead_scores', 'lead_scores_select_all', 'SELECT', 'true');
SELECT create_policy_for_all_roles('lead_scores', 'lead_scores_insert_all', 'INSERT', 'true', 'true');
SELECT create_policy_for_all_roles('lead_scores', 'lead_scores_update_all', 'UPDATE', 'true', 'true');
SELECT create_policy_for_all_roles('lead_scores', 'lead_scores_delete_all', 'DELETE', 'true');

-- 11. Fix EMAIL_TEMPLATES table policies
SELECT create_policy_for_all_roles('email_templates', 'email_templates_select_all', 'SELECT', 'true');
SELECT create_policy_for_all_roles('email_templates', 'email_templates_insert_all', 'INSERT', 'true', 'true');
SELECT create_policy_for_all_roles('email_templates', 'email_templates_update_all', 'UPDATE', 'true', 'true');
SELECT create_policy_for_all_roles('email_templates', 'email_templates_delete_all', 'DELETE', 'true');

-- 12. Fix WORKFLOWS table policies
SELECT create_policy_for_all_roles('workflows', 'workflows_select_all', 'SELECT', 'true');
SELECT create_policy_for_all_roles('workflows', 'workflows_insert_all', 'INSERT', 'true', 'true');
SELECT create_policy_for_all_roles('workflows', 'workflows_update_all', 'UPDATE', 'true', 'true');
SELECT create_policy_for_all_roles('workflows', 'workflows_delete_all', 'DELETE', 'true');

-- 13. Fix AUDIT_LOGS table policies
SELECT create_policy_for_all_roles('audit_logs', 'audit_logs_select_all', 'SELECT', 'true');
SELECT create_policy_for_all_roles('audit_logs', 'audit_logs_insert_all', 'INSERT', 'true', 'true');
SELECT create_policy_for_all_roles('audit_logs', 'audit_logs_update_all', 'UPDATE', 'true', 'true');
SELECT create_policy_for_all_roles('audit_logs', 'audit_logs_delete_all', 'DELETE', 'true');

-- 14. Fix CONVERSATION_INTELLIGENCE table policies
SELECT create_policy_for_all_roles('conversation_intelligence', 'conversation_intelligence_select_all', 'SELECT', 'true');
SELECT create_policy_for_all_roles('conversation_intelligence', 'conversation_intelligence_insert_all', 'INSERT', 'true', 'true');
SELECT create_policy_for_all_roles('conversation_intelligence', 'conversation_intelligence_update_all', 'UPDATE', 'true', 'true');
SELECT create_policy_for_all_roles('conversation_intelligence', 'conversation_intelligence_delete_all', 'DELETE', 'true');

-- 15. Fix MIGRATION_STATUS table policies
SELECT create_policy_for_all_roles('migration_status', 'migration_status_select_all', 'SELECT', 'true');
SELECT create_policy_for_all_roles('migration_status', 'migration_status_insert_all', 'INSERT', 'true', 'true');
SELECT create_policy_for_all_roles('migration_status', 'migration_status_update_all', 'UPDATE', 'true', 'true');
SELECT create_policy_for_all_roles('migration_status', 'migration_status_delete_all', 'DELETE', 'true');

-- Grant full permissions to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- Clean up
DROP FUNCTION IF EXISTS create_policy_for_all_roles;

-- Verify the changes
SELECT 
    p.tablename,
    p.policyname,
    p.cmd as operation,
    p.roles,
    CASE 
        WHEN 'anon' = ANY(p.roles) THEN 'YES ✅'
        ELSE 'NO ❌'
    END as anon_access,
    CASE 
        WHEN 'authenticated' = ANY(p.roles) THEN 'YES ✅'
        ELSE 'NO ❌'
    END as auth_access
FROM pg_policies p
WHERE p.schemaname = 'public'
AND p.cmd = 'SELECT'  -- Focus on SELECT policies
ORDER BY p.tablename, p.policyname;