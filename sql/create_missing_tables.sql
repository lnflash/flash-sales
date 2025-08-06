-- Create missing tables for Flash Sales application

-- =====================================================
-- ENRICHMENT CACHE TABLE
-- =====================================================
-- Create enrichment_cache table for storing API enrichment results
CREATE TABLE IF NOT EXISTS enrichment_cache (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL, -- 'company', 'person', 'phone', 'address'
    key VARCHAR(255) NOT NULL, -- domain, email, phone number, etc.
    data JSONB NOT NULL, -- Enrichment data
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index on type and key for fast lookups and preventing duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrichment_cache_type_key ON enrichment_cache(type, key);

-- Create index on timestamp for cache expiration queries
CREATE INDEX IF NOT EXISTS idx_enrichment_cache_timestamp ON enrichment_cache(timestamp);

-- Add comment
COMMENT ON TABLE enrichment_cache IS 'Stores cached results from external enrichment APIs to reduce API calls and improve performance';

-- =====================================================
-- RLS POLICIES FOR ENRICHMENT CACHE
-- =====================================================
-- Enable RLS
ALTER TABLE enrichment_cache ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "enrichment_cache_select_policy" ON enrichment_cache;
DROP POLICY IF EXISTS "enrichment_cache_insert_policy" ON enrichment_cache;
DROP POLICY IF EXISTS "enrichment_cache_update_policy" ON enrichment_cache;
DROP POLICY IF EXISTS "enrichment_cache_delete_policy" ON enrichment_cache;

-- Create new policies - allow all authenticated users to read/write cache
CREATE POLICY "enrichment_cache_select_policy" ON enrichment_cache
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "enrichment_cache_insert_policy" ON enrichment_cache
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "enrichment_cache_update_policy" ON enrichment_cache
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "enrichment_cache_delete_policy" ON enrichment_cache
    FOR DELETE TO authenticated
    USING (true);

-- =====================================================
-- PROGRAM WEEKLY GOALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS program_weekly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL,
  week_start DATE NOT NULL,
  calls INTEGER DEFAULT 50,
  meetings INTEGER DEFAULT 10,
  proposals INTEGER DEFAULT 5,
  follow_ups INTEGER DEFAULT 30,
  new_contacts INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Enable RLS
ALTER TABLE program_weekly_goals ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "program_weekly_goals_select_policy" ON program_weekly_goals;
DROP POLICY IF EXISTS "program_weekly_goals_insert_policy" ON program_weekly_goals;
DROP POLICY IF EXISTS "program_weekly_goals_update_policy" ON program_weekly_goals;
DROP POLICY IF EXISTS "program_weekly_goals_delete_policy" ON program_weekly_goals;

CREATE POLICY "program_weekly_goals_select_policy" ON program_weekly_goals
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "program_weekly_goals_insert_policy" ON program_weekly_goals
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "program_weekly_goals_update_policy" ON program_weekly_goals
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "program_weekly_goals_delete_policy" ON program_weekly_goals
    FOR DELETE TO authenticated
    USING (true);

-- =====================================================
-- PROGRAM SYNC STATUS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS program_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL,
  last_sync_at TIMESTAMPTZ,
  last_sync_direction VARCHAR(20) CHECK (last_sync_direction IN ('to_cloud', 'from_cloud', 'bidirectional')),
  sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'success', 'error', 'conflict')),
  error_message TEXT,
  error_count INTEGER DEFAULT 0,
  activities_synced INTEGER DEFAULT 0,
  goals_synced BOOLEAN DEFAULT false,
  custom_types_synced BOOLEAN DEFAULT false,
  device_id VARCHAR(255),
  app_version VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE program_sync_status ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "program_sync_status_select_policy" ON program_sync_status;
DROP POLICY IF EXISTS "program_sync_status_insert_policy" ON program_sync_status;
DROP POLICY IF EXISTS "program_sync_status_update_policy" ON program_sync_status;
DROP POLICY IF EXISTS "program_sync_status_delete_policy" ON program_sync_status;

CREATE POLICY "program_sync_status_select_policy" ON program_sync_status
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "program_sync_status_insert_policy" ON program_sync_status
    FOR INSERT TO authenticated
    WITH CHECK (true);

CREATE POLICY "program_sync_status_update_policy" ON program_sync_status
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

CREATE POLICY "program_sync_status_delete_policy" ON program_sync_status
    FOR DELETE TO authenticated
    USING (true);

-- Grant necessary permissions
GRANT ALL ON enrichment_cache TO authenticated;
GRANT ALL ON program_weekly_goals TO authenticated;
GRANT ALL ON program_sync_status TO authenticated;
GRANT USAGE ON SEQUENCE enrichment_cache_id_seq TO authenticated;
EOF < /dev/null