-- Complete RLS Setup Script
-- Run this after fix-users-rls-safe.sql to complete all RLS policies

-- First, run the workflow_runs and reports fixes
\i src/scripts/fix-remaining-rls.sql

-- Then apply remaining policies for tables that didn't have issues

-- Function to safely create policies
CREATE OR REPLACE FUNCTION create_policy_if_not_exists(
    p_table_name text,
    p_policy_name text,
    p_command text,
    p_using_expr text DEFAULT NULL,
    p_with_check_expr text DEFAULT NULL
) RETURNS void AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = p_table_name 
        AND policyname = p_policy_name
        AND schemaname = 'public'
    ) THEN
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

-- Apply remaining policies that weren't covered in previous scripts

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

-- Activities policies (using owner_id)
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

-- Audit logs policies
SELECT create_policy_if_not_exists('audit_logs', 'audit_logs_select_admin', 'SELECT',
    'EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ''admin'')');
SELECT create_policy_if_not_exists('audit_logs', 'audit_logs_insert_system', 'INSERT', NULL, 'true');

-- Migration status policies
SELECT create_policy_if_not_exists('migration_status', 'migration_status_admin', 'ALL',
    'EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = ''admin'')');

-- Clean up
DROP FUNCTION IF EXISTS create_policy_if_not_exists;

-- Final summary
SELECT 
    t.tablename,
    CASE WHEN t.rowsecurity THEN 'ENABLED ✅' ELSE 'DISABLED ❌' END as rls_status,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN t.rowsecurity AND COUNT(p.policyname) > 0 THEN 'SECURED ✅'
        WHEN t.rowsecurity AND COUNT(p.policyname) = 0 THEN 'RLS ENABLED BUT NO POLICIES ⚠️'
        ELSE 'NOT SECURED ❌'
    END as security_status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY 
    CASE 
        WHEN t.rowsecurity = false THEN 0
        WHEN t.rowsecurity = true AND COUNT(p.policyname) = 0 THEN 1
        ELSE 2
    END,
    t.tablename;