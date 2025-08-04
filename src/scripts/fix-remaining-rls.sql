-- Fix remaining RLS policies for tables with different column names
-- This fixes workflow_runs, reports, and other tables

-- 1. Fix workflow_runs policies (already has RLS enabled from previous script)
-- Drop incorrect policy if it exists
DROP POLICY IF EXISTS workflow_runs_select_authenticated ON workflow_runs;

-- Create correct policy based on actual columns
CREATE POLICY "workflow_runs_select_authenticated" ON workflow_runs
    FOR SELECT TO authenticated
    USING (
        -- Users can see workflow runs for their deals
        (deal_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.id = workflow_runs.deal_id 
            AND (deals.owner_id = auth.uid() OR deals.owner_id IS NULL)
        ))
        -- Or workflow runs for organizations they have deals with
        OR (organization_id IS NOT NULL AND EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.organization_id = workflow_runs.organization_id 
            AND deals.owner_id = auth.uid()
        ))
        -- Or if they're admin/sales_manager
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'sales_manager')
        )
    );

-- 2. Fix reports policies
-- Drop incorrect policies if they exist
DROP POLICY IF EXISTS reports_select_authenticated ON reports;
DROP POLICY IF EXISTS reports_insert_authenticated ON reports;
DROP POLICY IF EXISTS reports_update_own ON reports;
DROP POLICY IF EXISTS reports_delete_own ON reports;

-- Create correct policies based on actual columns (created_by_id, is_shared)
CREATE POLICY "reports_select_authenticated" ON reports
    FOR SELECT TO authenticated
    USING (
        created_by_id = auth.uid()
        OR is_shared = true  -- Changed from is_public
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'sales_manager')
        )
    );

CREATE POLICY "reports_insert_authenticated" ON reports
    FOR INSERT TO authenticated
    WITH CHECK (created_by_id = auth.uid());  -- Changed from created_by

CREATE POLICY "reports_update_own" ON reports
    FOR UPDATE TO authenticated
    USING (created_by_id = auth.uid());  -- Changed from created_by

CREATE POLICY "reports_delete_own" ON reports
    FOR DELETE TO authenticated
    USING (created_by_id = auth.uid());  -- Changed from created_by

-- 3. Check conversation_intelligence structure
-- Drop incorrect policy if exists
DROP POLICY IF EXISTS conversation_intelligence_select_own ON conversation_intelligence;

-- Create correct policy
CREATE POLICY "conversation_intelligence_select_own" ON conversation_intelligence
    FOR SELECT TO authenticated
    USING (
        -- Check via activity -> deal relationship
        EXISTS (
            SELECT 1 
            FROM activities a
            JOIN deals d ON a.deal_id = d.id
            WHERE a.id = conversation_intelligence.activity_id
            AND d.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'sales_manager')
        )
    );

-- 4. Verify all policies were created successfully
SELECT 
    t.tablename,
    CASE WHEN t.rowsecurity THEN 'ENABLED ✅' ELSE 'DISABLED ❌' END as rls_status,
    COUNT(p.policyname) as policy_count,
    STRING_AGG(p.policyname, ', ' ORDER BY p.policyname) as policies
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
AND t.tablename IN ('workflow_runs', 'reports', 'conversation_intelligence')
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;