-- Fix workflow_runs RLS policy
-- The workflow_runs table doesn't have entity_type/entity_id columns
-- It has deal_id and organization_id directly

-- Drop the incorrect policy if it exists
DROP POLICY IF EXISTS workflow_runs_select_authenticated ON workflow_runs;

-- Create the correct policy based on actual table structure
CREATE POLICY "workflow_runs_select_authenticated" ON workflow_runs
    FOR SELECT TO authenticated
    USING (
        -- Users can see workflow runs for their deals
        EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.id = workflow_runs.deal_id 
            AND (deals.owner_id = auth.uid() OR deals.owner_id IS NULL)
        )
        -- Or workflow runs for their organizations
        OR EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.organization_id = workflow_runs.organization_id 
            AND deals.owner_id = auth.uid()
        )
        -- Or if they're admin/sales_manager
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'sales_manager')
        )
    );

-- Also create insert/update/delete policies for workflow_runs
CREATE POLICY "workflow_runs_insert_authenticated" ON workflow_runs
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Can insert if they own the deal
        EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.id = workflow_runs.deal_id 
            AND deals.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'sales_manager')
        )
    );

CREATE POLICY "workflow_runs_update_authenticated" ON workflow_runs
    FOR UPDATE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM deals 
            WHERE deals.id = workflow_runs.deal_id 
            AND deals.owner_id = auth.uid()
        )
        OR EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'sales_manager')
        )
    );

CREATE POLICY "workflow_runs_delete_admin" ON workflow_runs
    FOR DELETE TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Also check if reports table has the expected columns
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_name = 'reports'
AND table_schema = 'public'
ORDER BY ordinal_position;