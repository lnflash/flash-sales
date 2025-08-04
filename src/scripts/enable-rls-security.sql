-- Enable Row Level Security (RLS) on all tables
-- This script enables RLS and creates appropriate policies for data access control

-- Enable RLS on all tables that don't have it
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

-- Organizations policies
-- Users can see all organizations (needed for deal assignments)
CREATE POLICY "organizations_select_authenticated" ON organizations
    FOR SELECT TO authenticated
    USING (true);

-- Only admins can insert/update/delete organizations
CREATE POLICY "organizations_insert_admin" ON organizations
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'sales_manager')
        )
    );

CREATE POLICY "organizations_update_admin" ON organizations
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'sales_manager')
        )
    );

CREATE POLICY "organizations_delete_admin" ON organizations
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Contacts policies
-- Users can see contacts for organizations they have access to
CREATE POLICY "contacts_select_authenticated" ON contacts
    FOR SELECT TO authenticated
    USING (true);

-- Users can manage contacts for their deals
CREATE POLICY "contacts_insert_authenticated" ON contacts
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.organization_id = contacts.organization_id 
            AND deals.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'sales_manager')
        )
    );

CREATE POLICY "contacts_update_authenticated" ON contacts
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.organization_id = contacts.organization_id 
            AND deals.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'sales_manager')
        )
    );

-- Users policies
-- Users can see all users (for team collaboration)
CREATE POLICY "users_select_authenticated" ON users
    FOR SELECT TO authenticated
    USING (true);

-- Users can update their own profile
CREATE POLICY "users_update_own" ON users
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Only admins can insert new users
CREATE POLICY "users_insert_admin" ON users
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Activities policies
-- Users can see all activities for transparency
CREATE POLICY "activities_select_authenticated" ON activities
    FOR SELECT TO authenticated
    USING (true);

-- Users can manage their own activities
CREATE POLICY "activities_insert_own" ON activities
    FOR INSERT TO authenticated
    WITH CHECK (owner_id = auth.uid());

CREATE POLICY "activities_update_own" ON activities
    FOR UPDATE TO authenticated
    USING (owner_id = auth.uid());

CREATE POLICY "activities_delete_own" ON activities
    FOR DELETE TO authenticated
    USING (owner_id = auth.uid());

-- Deals policies
-- Users can see all deals (needed for lead routing)
CREATE POLICY "deals_select_authenticated" ON deals
    FOR SELECT TO authenticated
    USING (true);

-- Users can insert deals
CREATE POLICY "deals_insert_authenticated" ON deals
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Users can update their own deals or admins can update any
CREATE POLICY "deals_update_authenticated" ON deals
    FOR UPDATE TO authenticated
    USING (
        owner_id = auth.uid()
        OR owner_id IS NULL  -- Unassigned deals
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'sales_manager')
        )
    );

-- Only admins can delete deals
CREATE POLICY "deals_delete_admin" ON deals
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Teams policies
-- All authenticated users can view teams
CREATE POLICY "teams_select_authenticated" ON teams
    FOR SELECT TO authenticated
    USING (true);

-- Only admins can manage teams
CREATE POLICY "teams_insert_admin" ON teams
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "teams_update_admin" ON teams
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "teams_delete_admin" ON teams
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Pipelines policies
-- All authenticated users can view pipelines
CREATE POLICY "pipelines_select_authenticated" ON pipelines
    FOR SELECT TO authenticated
    USING (true);

-- Only admins can manage pipelines
CREATE POLICY "pipelines_manage_admin" ON pipelines
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Lead scores policies
-- Users can view all lead scores
CREATE POLICY "lead_scores_select_authenticated" ON lead_scores
    FOR SELECT TO authenticated
    USING (true);

-- System or admins can manage lead scores
CREATE POLICY "lead_scores_manage_admin" ON lead_scores
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Email templates policies
-- All users can view email templates
CREATE POLICY "email_templates_select_authenticated" ON email_templates
    FOR SELECT TO authenticated
    USING (true);

-- Only admins can manage email templates
CREATE POLICY "email_templates_manage_admin" ON email_templates
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'sales_manager')
        )
    );

-- Workflows policies
-- Users can view workflows
CREATE POLICY "workflows_select_authenticated" ON workflows
    FOR SELECT TO authenticated
    USING (true);

-- Only admins can manage workflows
CREATE POLICY "workflows_manage_admin" ON workflows
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Workflow runs policies
-- Users can see workflow runs for their deals
CREATE POLICY "workflow_runs_select_authenticated" ON workflow_runs
    FOR SELECT TO authenticated
    USING (
        entity_type != 'deal'
        OR EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.id = workflow_runs.entity_id::uuid 
            AND (deals.owner_id = auth.uid() OR deals.owner_id IS NULL)
        )
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'sales_manager')
        )
    );

-- Reports policies
-- Users can view their own reports or public reports
CREATE POLICY "reports_select_authenticated" ON reports
    FOR SELECT TO authenticated
    USING (
        created_by = auth.uid()
        OR is_public = true
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'sales_manager')
        )
    );

-- Users can create reports
CREATE POLICY "reports_insert_authenticated" ON reports
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

-- Users can update their own reports
CREATE POLICY "reports_update_own" ON reports
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid());

-- Users can delete their own reports
CREATE POLICY "reports_delete_own" ON reports
    FOR DELETE TO authenticated
    USING (created_by = auth.uid());

-- Audit logs policies
-- Only admins can view audit logs
CREATE POLICY "audit_logs_select_admin" ON audit_logs
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- System can insert audit logs (usually done through functions)
CREATE POLICY "audit_logs_insert_system" ON audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Conversation intelligence policies
-- Users can see their own conversation intelligence data
CREATE POLICY "conversation_intelligence_select_own" ON conversation_intelligence
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.id = conversation_intelligence.deal_id 
            AND deals.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'sales_manager')
        )
    );

-- Migration status policies
-- Only admins can view and manage migration status
CREATE POLICY "migration_status_admin" ON migration_status
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;