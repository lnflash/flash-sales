-- Quick RLS Enable Script
-- This is a simplified version that just enables RLS with basic policies
-- Use this if you need to quickly secure your database

-- Enable RLS on all tables
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

-- Create a simple "authenticated users can do everything" policy for each table
-- This maintains current functionality while enabling RLS

CREATE POLICY "Enable all access for authenticated users" ON organizations
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON contacts
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON workflow_runs
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON reports
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON users
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON activities
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON deals
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON teams
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON pipelines
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON lead_scores
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON email_templates
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON workflows
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON audit_logs
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON conversation_intelligence
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON migration_status
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Note: This script enables RLS with permissive policies
-- You should replace these with more restrictive policies based on your security requirements
-- Use the enable-rls-security.sql script for production-ready policies