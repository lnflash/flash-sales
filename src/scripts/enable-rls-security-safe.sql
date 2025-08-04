-- Enable Row Level Security (RLS) on all tables - SAFE VERSION
-- This script checks for existing policies before creating new ones

-- Enable RLS on all tables (safe to run multiple times)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_status ENABLE ROW LEVEL SECURITY;

-- Function to safely create policies
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
    p_table_name text,
    p_policy_name text,
    p_command text,
    p_using_expr text DEFAULT NULL,
    p_with_check_expr text DEFAULT NULL
) RETURNS void AS $$
BEGIN
    -- Check if policy exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = p_table_name 
        AND policyname = p_policy_name
        AND schemaname = 'public'
    ) THEN
        -- Build the CREATE POLICY statement
        DECLARE
            sql_stmt text;
        BEGIN
            sql_stmt := format('CREATE POLICY %I ON %I FOR %s TO authenticated',
                p_policy_name, p_table_name, p_command);
            
            IF p_using_expr IS NOT NULL THEN
                sql_stmt := sql_stmt || format(' USING (%s)', p_using_expr);
            END IF;
            
            IF p_with_check_expr IS NOT NULL THEN
                sql_stmt := sql_stmt || format(' WITH CHECK (%s)', p_with_check_expr);
            END IF;
            
            EXECUTE sql_stmt;
        END;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Organizations policies
SELECT create_policy_if_not_exists('organizations', 'organizations_select_authenticated', 'SELECT', 'true');
SELECT create_policy_if_not_exists('organizations', 'organizations_insert_admin', 'INSERT', NULL, 
    'EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''admin'', ''sales_manager''))');
SELECT create_policy_if_not_exists('organizations', 'organizations_update_admin', 'UPDATE',
    'EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''admin'', ''sales_manager''))');
SELECT create_policy_if_not_exists('organizations', 'organizations_delete_admin', 'DELETE',
    'EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ''admin'')');

-- Contacts policies
SELECT create_policy_if_not_exists('contacts', 'contacts_select_authenticated', 'SELECT', 'true');
SELECT create_policy_if_not_exists('contacts', 'contacts_insert_authenticated', 'INSERT', NULL,
    'EXISTS (SELECT 1 FROM deals WHERE deals.organization_id = contacts.organization_id AND deals.owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''admin'', ''sales_manager''))');
SELECT create_policy_if_not_exists('contacts', 'contacts_update_authenticated', 'UPDATE',
    'EXISTS (SELECT 1 FROM deals WHERE deals.organization_id = contacts.organization_id AND deals.owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''admin'', ''sales_manager''))');

-- Activities policies (using owner_id not user_id)
SELECT create_policy_if_not_exists('activities', 'activities_select_authenticated', 'SELECT', 'true');
SELECT create_policy_if_not_exists('activities', 'activities_insert_own', 'INSERT', NULL, 'owner_id = auth.uid()');
SELECT create_policy_if_not_exists('activities', 'activities_update_own', 'UPDATE', 'owner_id = auth.uid()');
SELECT create_policy_if_not_exists('activities', 'activities_delete_own', 'DELETE', 'owner_id = auth.uid()');

-- Deals policies
SELECT create_policy_if_not_exists('deals', 'deals_select_authenticated', 'SELECT', 'true');
SELECT create_policy_if_not_exists('deals', 'deals_insert_authenticated', 'INSERT', NULL, 'true');
SELECT create_policy_if_not_exists('deals', 'deals_update_authenticated', 'UPDATE',
    'owner_id = auth.uid() OR owner_id IS NULL OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''admin'', ''sales_manager''))');
SELECT create_policy_if_not_exists('deals', 'deals_delete_admin', 'DELETE',
    'EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ''admin'')');

-- Teams policies
SELECT create_policy_if_not_exists('teams', 'teams_select_authenticated', 'SELECT', 'true');
SELECT create_policy_if_not_exists('teams', 'teams_insert_admin', 'INSERT', NULL,
    'EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ''admin'')');
SELECT create_policy_if_not_exists('teams', 'teams_update_admin', 'UPDATE',
    'EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ''admin'')');
SELECT create_policy_if_not_exists('teams', 'teams_delete_admin', 'DELETE',
    'EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ''admin'')');

-- Pipelines policies
SELECT create_policy_if_not_exists('pipelines', 'pipelines_select_authenticated', 'SELECT', 'true');
SELECT create_policy_if_not_exists('pipelines', 'pipelines_manage_admin', 'ALL',
    'EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ''admin'')');

-- Lead scores policies
SELECT create_policy_if_not_exists('lead_scores', 'lead_scores_select_authenticated', 'SELECT', 'true');
SELECT create_policy_if_not_exists('lead_scores', 'lead_scores_manage_admin', 'ALL',
    'EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ''admin'')');

-- Email templates policies
SELECT create_policy_if_not_exists('email_templates', 'email_templates_select_authenticated', 'SELECT', 'true');
SELECT create_policy_if_not_exists('email_templates', 'email_templates_manage_admin', 'ALL',
    'EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''admin'', ''sales_manager''))');

-- Workflows policies
SELECT create_policy_if_not_exists('workflows', 'workflows_select_authenticated', 'SELECT', 'true');
SELECT create_policy_if_not_exists('workflows', 'workflows_manage_admin', 'ALL',
    'EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ''admin'')');

-- Workflow runs policies
SELECT create_policy_if_not_exists('workflow_runs', 'workflow_runs_select_authenticated', 'SELECT',
    'entity_type != ''deal'' OR EXISTS (SELECT 1 FROM deals WHERE deals.id = workflow_runs.entity_id::uuid AND (deals.owner_id = auth.uid() OR deals.owner_id IS NULL)) OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''admin'', ''sales_manager''))');

-- Reports policies
SELECT create_policy_if_not_exists('reports', 'reports_select_authenticated', 'SELECT',
    'created_by = auth.uid() OR is_public = true OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''admin'', ''sales_manager''))');
SELECT create_policy_if_not_exists('reports', 'reports_insert_authenticated', 'INSERT', NULL, 'created_by = auth.uid()');
SELECT create_policy_if_not_exists('reports', 'reports_update_own', 'UPDATE', 'created_by = auth.uid()');
SELECT create_policy_if_not_exists('reports', 'reports_delete_own', 'DELETE', 'created_by = auth.uid()');

-- Audit logs policies
SELECT create_policy_if_not_exists('audit_logs', 'audit_logs_select_admin', 'SELECT',
    'EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ''admin'')');
SELECT create_policy_if_not_exists('audit_logs', 'audit_logs_insert_system', 'INSERT', NULL, 'true');

-- Conversation intelligence policies
SELECT create_policy_if_not_exists('conversation_intelligence', 'conversation_intelligence_select_own', 'SELECT',
    'EXISTS (SELECT 1 FROM deals WHERE deals.id = conversation_intelligence.deal_id AND deals.owner_id = auth.uid()) OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN (''admin'', ''sales_manager''))');

-- Migration status policies
SELECT create_policy_if_not_exists('migration_status', 'migration_status_admin', 'ALL',
    'EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ''admin'')');

-- Clean up the helper function
DROP FUNCTION IF EXISTS create_policy_if_not_exists;

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Show summary of what was done
SELECT 
    t.tablename,
    CASE WHEN t.rowsecurity THEN 'ENABLED ✅' ELSE 'DISABLED ❌' END as rls_status,
    COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;