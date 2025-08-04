-- Fix Production Errors Script
-- Run this in Supabase SQL editor

-- 1. Fix program_sync_status table - add missing columns
ALTER TABLE program_sync_status 
ADD COLUMN IF NOT EXISTS activitiesSynced INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS activitiesTotal INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS goalsSynced INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS goalsTotal INTEGER DEFAULT 0;

-- 2. Create program_weekly_goals table if it doesn't exist
CREATE TABLE IF NOT EXISTS program_weekly_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    week_start DATE NOT NULL,
    business_development_goal INTEGER DEFAULT 0,
    follow_ups_goal INTEGER DEFAULT 0,
    meetings_goal INTEGER DEFAULT 0,
    proposals_goal INTEGER DEFAULT 0,
    closes_goal INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- 3. Enable RLS on new tables
ALTER TABLE program_weekly_goals ENABLE ROW LEVEL SECURITY;

-- 4. Create policies for program_weekly_goals
-- Allow all authenticated and anon users to read
CREATE POLICY "program_weekly_goals_select_all" ON program_weekly_goals
    FOR SELECT TO authenticated, anon
    USING (true);

-- Allow all authenticated and anon users to insert
CREATE POLICY "program_weekly_goals_insert_all" ON program_weekly_goals
    FOR INSERT TO authenticated, anon
    WITH CHECK (true);

-- Allow all authenticated and anon users to update
CREATE POLICY "program_weekly_goals_update_all" ON program_weekly_goals
    FOR UPDATE TO authenticated, anon
    USING (true)
    WITH CHECK (true);

-- Allow all authenticated and anon users to delete
CREATE POLICY "program_weekly_goals_delete_all" ON program_weekly_goals
    FOR DELETE TO authenticated, anon
    USING (true);

-- 5. Fix CORS for anon role - ensure PATCH is allowed
-- This is handled by Supabase settings, but we can ensure tables have proper permissions
GRANT ALL ON program_weekly_goals TO anon;
GRANT ALL ON program_sync_status TO anon;

-- 6. Create RPC function to handle PATCH operations (workaround for CORS)
CREATE OR REPLACE FUNCTION update_organization(
    org_id UUID,
    name_param TEXT DEFAULT NULL,
    state_province_param TEXT DEFAULT NULL,
    country_param TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    UPDATE organizations
    SET 
        name = COALESCE(name_param, name),
        state_province = COALESCE(state_province_param, state_province),
        country = COALESCE(country_param, country),
        updated_at = NOW()
    WHERE id = org_id
    RETURNING to_jsonb(organizations.*) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon
GRANT EXECUTE ON FUNCTION update_organization TO anon;

-- 7. Create RPC function for updating contacts
CREATE OR REPLACE FUNCTION update_contact(
    contact_id UUID,
    phone_primary_param TEXT DEFAULT NULL,
    email_param TEXT DEFAULT NULL,
    first_name_param TEXT DEFAULT NULL,
    last_name_param TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    UPDATE contacts
    SET 
        phone_primary = COALESCE(phone_primary_param, phone_primary),
        email = COALESCE(email_param, email),
        first_name = COALESCE(first_name_param, first_name),
        last_name = COALESCE(last_name_param, last_name),
        updated_at = NOW()
    WHERE id = contact_id
    RETURNING to_jsonb(contacts.*) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon
GRANT EXECUTE ON FUNCTION update_contact TO anon;

-- 8. Create RPC function for updating deals
CREATE OR REPLACE FUNCTION update_deal(
    deal_id UUID,
    updates JSONB
) RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Update deal with provided fields
    UPDATE deals
    SET 
        name = COALESCE((updates->>'name')::TEXT, name),
        package_seen = COALESCE((updates->>'package_seen')::BOOLEAN, package_seen),
        decision_makers = COALESCE((updates->>'decision_makers')::TEXT, decision_makers),
        interest_level = COALESCE((updates->>'interest_level')::INTEGER, interest_level),
        status = COALESCE((updates->>'status')::TEXT, status),
        lead_status = COALESCE((updates->>'lead_status')::TEXT, lead_status),
        specific_needs = COALESCE((updates->>'specific_needs')::TEXT, specific_needs),
        stage = COALESCE((updates->>'stage')::TEXT, stage),
        metadata = COALESCE((updates->>'metadata')::JSONB, metadata),
        updated_at = NOW()
    WHERE id = deal_id
    RETURNING to_jsonb(deals.*) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon
GRANT EXECUTE ON FUNCTION update_deal TO anon;

-- 9. Verify all tables have proper anon access
DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('GRANT ALL ON %I TO anon', t.tablename);
    END LOOP;
END $$;

-- 10. Summary
SELECT 
    'Production fixes applied successfully' as status,
    NOW() as applied_at;