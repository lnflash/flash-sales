-- SAFE PRODUCTION FIX - Handles existing policies
-- Run this in Supabase SQL Editor

-- 1. Fix program_sync_status table
ALTER TABLE IF EXISTS program_sync_status 
ADD COLUMN IF NOT EXISTS activitiesSynced INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS activitiesTotal INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS goalsSynced INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS goalsTotal INTEGER DEFAULT 0;

-- 2. Create program_weekly_goals table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'program_weekly_goals') THEN
        CREATE TABLE program_weekly_goals (
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
        
        ALTER TABLE program_weekly_goals ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 3. Create or replace policies for program_weekly_goals
DROP POLICY IF EXISTS "allow_all_for_testing" ON program_weekly_goals;
CREATE POLICY "allow_all_anon_access" ON program_weekly_goals
FOR ALL TO authenticated, anon
USING (true)
WITH CHECK (true);

-- 4. Ensure organizations table exists
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    state_province TEXT,
    country TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'organizations' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 5. Ensure contacts table exists
CREATE TABLE IF NOT EXISTS contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID,
    phone_primary TEXT,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'contacts' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 6. Ensure activities table exists
CREATE TABLE IF NOT EXISTS activities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    deal_id UUID,
    organization_id UUID,
    contact_id UUID,
    owner_id UUID,
    type TEXT,
    subject TEXT,
    description TEXT,
    status TEXT DEFAULT 'pending',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS if not already enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'activities' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 7. Ensure deals table has all required columns
ALTER TABLE IF EXISTS deals
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS organization_id UUID,
ADD COLUMN IF NOT EXISTS primary_contact_id UUID,
ADD COLUMN IF NOT EXISTS package_seen BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS decision_makers TEXT,
ADD COLUMN IF NOT EXISTS interest_level INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open',
ADD COLUMN IF NOT EXISTS lead_status TEXT DEFAULT 'new',
ADD COLUMN IF NOT EXISTS specific_needs TEXT,
ADD COLUMN IF NOT EXISTS stage TEXT DEFAULT 'initial_contact',
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 8. Create simple anon access policies for all tables
DO $$
DECLARE
    t RECORD;
BEGIN
    FOR t IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('organizations', 'contacts', 'activities', 'deals', 'users')
    LOOP
        -- Drop any existing "allow_all_for_testing" policy
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_for_testing" ON %I', t.tablename);
        
        -- Check if a permissive policy already exists
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' 
            AND tablename = t.tablename 
            AND policyname LIKE '%anon%'
        ) THEN
            -- Create new anon access policy
            EXECUTE format('
                CREATE POLICY "allow_anon_access" ON %I
                FOR ALL TO authenticated, anon
                USING (true)
                WITH CHECK (true)
            ', t.tablename);
            
            RAISE NOTICE 'Created anon access policy for table: %', t.tablename;
        END IF;
    END LOOP;
END $$;

-- 9. Grant permissions to anon role
GRANT USAGE ON SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon;

-- 10. Test that everything is working
SELECT 
    t.tablename,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM pg_policies p 
            WHERE p.tablename = t.tablename 
            AND p.schemaname = 'public'
            AND 'anon' = ANY(p.roles)
        ) THEN '✅ Has anon policy'
        ELSE '❌ Missing anon policy'
    END as policy_status,
    has_table_privilege('anon', 'public.'||t.tablename, 'SELECT') as can_read,
    has_table_privilege('anon', 'public.'||t.tablename, 'INSERT') as can_insert
FROM pg_tables t
WHERE t.schemaname = 'public'
AND t.tablename IN ('deals', 'organizations', 'contacts', 'activities', 'program_weekly_goals', 'program_sync_status')
ORDER BY t.tablename;