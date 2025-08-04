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
    
    sql_stmt := sql_stmt || format(' USING (%s)', p_using_expr);
    
    IF p_with_check_expr IS NOT NULL AND p_command != 'SELECT' THEN
        sql_stmt := sql_stmt || format(' WITH CHECK (%s)', p_with_check_expr);
    END IF;
    
    EXECUTE sql_stmt;
    RAISE NOTICE 'Created policy % on % for authenticated and anon roles', p_policy_name, p_table_name;
END;
$$ LANGUAGE plpgsql;

-- 1. Fix USERS table policies
SELECT create_policy_for_all_roles('users', 'users_select_all', 'SELECT', 'true');
-- Keep restricted policies for modification
DROP POLICY IF EXISTS users_insert_own ON users;
CREATE POLICY "users_insert_own" ON users
    FOR INSERT TO authenticated  -- Only authenticated can insert
    WITH CHECK (id = auth.uid() OR auth.uid() IS NULL);

DROP POLICY IF EXISTS users_update_own ON users;
CREATE POLICY "users_update_own" ON users
    FOR UPDATE TO authenticated  -- Only authenticated can update
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 2. Fix DEALS table policies
SELECT create_policy_for_all_roles('deals', 'deals_select_all', 'SELECT', 'true');
SELECT create_policy_for_all_roles('deals', 'deals_insert_all', 'INSERT', 'true', 'true');
-- Update policy for authenticated users only
DROP POLICY IF EXISTS deals_update_authenticated ON deals;
CREATE POLICY "deals_update_authenticated" ON deals
    FOR UPDATE TO authenticated
    USING (owner_id = auth.uid() OR owner_id IS NULL OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'sales_manager')));

-- 3. Fix ORGANIZATIONS table policies
SELECT create_policy_for_all_roles('organizations', 'organizations_select_all', 'SELECT', 'true');
-- Keep insert/update/delete for authenticated only
DROP POLICY IF EXISTS organizations_insert_admin ON organizations;
CREATE POLICY "organizations_insert_admin" ON organizations
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'sales_manager')));

-- 4. Fix CONTACTS table policies
SELECT create_policy_for_all_roles('contacts', 'contacts_select_all', 'SELECT', 'true');
-- Keep insert/update for authenticated only
DROP POLICY IF EXISTS contacts_insert_authenticated ON contacts;
CREATE POLICY "contacts_insert_authenticated" ON contacts
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- 5. Fix ACTIVITIES table policies
SELECT create_policy_for_all_roles('activities', 'activities_select_all', 'SELECT', 'true');
-- Keep other policies for authenticated only

-- 6. Fix WORKFLOW_RUNS table policies
SELECT create_policy_for_all_roles('workflow_runs', 'workflow_runs_select_all', 'SELECT', 'true');

-- 7. Fix REPORTS table policies
SELECT create_policy_for_all_roles('reports', 'reports_select_all', 'SELECT', 
    'is_shared = true OR created_by_id = auth.uid() OR auth.uid() IS NULL');

-- 8. Fix TEAMS table policies
SELECT create_policy_for_all_roles('teams', 'teams_select_all', 'SELECT', 'true');

-- 9. Fix PIPELINES table policies
SELECT create_policy_for_all_roles('pipelines', 'pipelines_select_all', 'SELECT', 'true');

-- 10. Fix LEAD_SCORES table policies
SELECT create_policy_for_all_roles('lead_scores', 'lead_scores_select_all', 'SELECT', 'true');

-- 11. Fix EMAIL_TEMPLATES table policies
SELECT create_policy_for_all_roles('email_templates', 'email_templates_select_all', 'SELECT', 'true');

-- 12. Fix WORKFLOWS table policies
SELECT create_policy_for_all_roles('workflows', 'workflows_select_all', 'SELECT', 'true');

-- 13. Fix AUDIT_LOGS table policies (keep restricted)
-- Audit logs should only be visible to admins
DROP POLICY IF EXISTS audit_logs_select_admin ON audit_logs;
CREATE POLICY "audit_logs_select_admin" ON audit_logs
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- 14. Fix CONVERSATION_INTELLIGENCE table policies
SELECT create_policy_for_all_roles('conversation_intelligence', 'conversation_intelligence_select_all', 'SELECT', 'true');

-- 15. Fix MIGRATION_STATUS table policies (keep restricted)
-- Migration status should only be visible to admins
DROP POLICY IF EXISTS migration_status_admin ON migration_status;
CREATE POLICY "migration_status_admin" ON migration_status
    FOR ALL TO authenticated
    USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin'));

-- Grant necessary permissions to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT INSERT ON deals, organizations, contacts TO anon;  -- Allow lead submission
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;
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