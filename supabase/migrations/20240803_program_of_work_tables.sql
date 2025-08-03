-- Program of Work Tables for Hybrid Storage
-- This migration creates tables to sync Program of Work data from localStorage to Supabase
-- Enables admin visibility while maintaining offline-first functionality

-- =====================================================
-- WEEKLY GOALS TABLE
-- =====================================================
-- Stores weekly targets per user
CREATE TABLE IF NOT EXISTS program_weekly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL, -- Denormalized for easier queries
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

-- =====================================================
-- PROGRAM ACTIVITIES TABLE
-- =====================================================
-- Stores all program activities with sync support
CREATE TABLE IF NOT EXISTS program_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL, -- Denormalized for easier queries
  local_id VARCHAR(255) NOT NULL, -- To match localStorage IDs
  type VARCHAR(50) NOT NULL CHECK (type IN ('call', 'meeting', 'proposal', 'follow_up', 'email', 'site_visit', 'presentation', 'training', 'other')),
  custom_type VARCHAR(100), -- For user-defined types
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME,
  duration INTEGER, -- minutes
  status VARCHAR(20) DEFAULT 'planned' CHECK (status IN ('planned', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  -- CRM entity references
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES deals(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  entity_name VARCHAR(255), -- Denormalized display name (org/contact/deal name)
  outcome TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, local_id)
);

-- =====================================================
-- CUSTOM ACTIVITY TYPES TABLE
-- =====================================================
-- Stores user-defined activity types
CREATE TABLE IF NOT EXISTS program_custom_activity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  username VARCHAR(255) NOT NULL,
  type_name VARCHAR(100) NOT NULL,
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type_name)
);

-- =====================================================
-- SYNC STATUS TABLE
-- =====================================================
-- Tracks sync status and health
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
  device_id VARCHAR(255), -- To track which device last synced
  app_version VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- =====================================================
-- OFFLINE SYNC QUEUE TABLE
-- =====================================================
-- Stores changes made while offline
CREATE TABLE IF NOT EXISTS program_offline_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation VARCHAR(20) NOT NULL CHECK (operation IN ('create', 'update', 'delete')),
  entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('activity', 'goal', 'custom_type')),
  entity_id VARCHAR(255) NOT NULL,
  payload JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_program_activities_user_date ON program_activities(user_id, date);
CREATE INDEX IF NOT EXISTS idx_program_activities_user_status ON program_activities(user_id, status);
CREATE INDEX IF NOT EXISTS idx_program_activities_date_status ON program_activities(date, status);
CREATE INDEX IF NOT EXISTS idx_program_activities_organization ON program_activities(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_program_activities_deal ON program_activities(deal_id) WHERE deal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_program_activities_contact ON program_activities(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_program_weekly_goals_user_week ON program_weekly_goals(user_id, week_start);
CREATE INDEX IF NOT EXISTS idx_program_weekly_goals_week ON program_weekly_goals(week_start);
CREATE INDEX IF NOT EXISTS idx_program_sync_status_user ON program_sync_status(user_id);
CREATE INDEX IF NOT EXISTS idx_program_offline_queue_user_unprocessed ON program_offline_queue(user_id) WHERE processed_at IS NULL;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE program_weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_custom_activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_sync_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_offline_queue ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES - USERS
-- =====================================================
-- Users can read/write their own data
CREATE POLICY "Users can manage own goals" ON program_weekly_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own activities" ON program_activities
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own activity types" ON program_custom_activity_types
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sync status" ON program_sync_status
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own offline queue" ON program_offline_queue
  FOR ALL USING (auth.uid() = user_id);

-- =====================================================
-- RLS POLICIES - ADMINS
-- =====================================================
-- Admins (Flash Management, Flash Admin) can read all data
CREATE POLICY "Admins can read all goals" ON program_weekly_goals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Flash Management', 'Flash Admin')
    )
  );

CREATE POLICY "Admins can read all activities" ON program_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Flash Management', 'Flash Admin')
    )
  );

CREATE POLICY "Admins can read all custom types" ON program_custom_activity_types
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Flash Management', 'Flash Admin')
    )
  );

CREATE POLICY "Admins can read all sync status" ON program_sync_status
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Flash Management', 'Flash Admin')
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================
-- Function to get weekly activity summary
CREATE OR REPLACE FUNCTION get_weekly_activity_summary(
  p_user_id UUID DEFAULT NULL,
  p_week_start DATE DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  username VARCHAR,
  week_start DATE,
  total_activities INTEGER,
  completed_activities INTEGER,
  cancelled_activities INTEGER,
  completion_rate NUMERIC,
  calls_completed INTEGER,
  meetings_completed INTEGER,
  proposals_completed INTEGER,
  follow_ups_completed INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pa.user_id,
    pa.username,
    DATE_TRUNC('week', pa.date)::DATE as week_start,
    COUNT(*)::INTEGER as total_activities,
    COUNT(*) FILTER (WHERE pa.status = 'completed')::INTEGER as completed_activities,
    COUNT(*) FILTER (WHERE pa.status = 'cancelled')::INTEGER as cancelled_activities,
    CASE 
      WHEN COUNT(*) > 0 
      THEN ROUND((COUNT(*) FILTER (WHERE pa.status = 'completed')::NUMERIC / COUNT(*)) * 100, 2)
      ELSE 0
    END as completion_rate,
    COUNT(*) FILTER (WHERE pa.status = 'completed' AND pa.type = 'call')::INTEGER as calls_completed,
    COUNT(*) FILTER (WHERE pa.status = 'completed' AND pa.type = 'meeting')::INTEGER as meetings_completed,
    COUNT(*) FILTER (WHERE pa.status = 'completed' AND pa.type = 'proposal')::INTEGER as proposals_completed,
    COUNT(*) FILTER (WHERE pa.status = 'completed' AND pa.type = 'follow_up')::INTEGER as follow_ups_completed
  FROM program_activities pa
  WHERE 
    (p_user_id IS NULL OR pa.user_id = p_user_id)
    AND (p_week_start IS NULL OR DATE_TRUNC('week', pa.date)::DATE = p_week_start)
  GROUP BY pa.user_id, pa.username, DATE_TRUNC('week', pa.date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================
-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_program_weekly_goals_updated_at 
  BEFORE UPDATE ON program_weekly_goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_activities_updated_at 
  BEFORE UPDATE ON program_activities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_program_sync_status_updated_at 
  BEFORE UPDATE ON program_sync_status
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update completed_at when activity is completed
CREATE OR REPLACE FUNCTION update_activity_completed_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'completed' AND OLD.status = 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    NEW.cancelled_at = NOW();
  ELSIF NEW.status != 'cancelled' AND OLD.status = 'cancelled' THEN
    NEW.cancelled_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_activity_status_timestamps
  BEFORE UPDATE ON program_activities
  FOR EACH ROW EXECUTE FUNCTION update_activity_completed_at();

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE program_weekly_goals IS 'Stores weekly targets for Program of Work - synced from localStorage';
COMMENT ON TABLE program_activities IS 'Stores all program activities with hybrid sync support between localStorage and cloud';
COMMENT ON TABLE program_custom_activity_types IS 'User-defined activity types for personalized workflows';
COMMENT ON TABLE program_sync_status IS 'Tracks sync health and status for each user';
COMMENT ON TABLE program_offline_queue IS 'Queue for changes made while offline, processed when connection restored';

COMMENT ON COLUMN program_activities.local_id IS 'Matches the ID used in localStorage for conflict resolution';
COMMENT ON COLUMN program_activities.metadata IS 'Flexible JSON storage for future features without schema changes';
COMMENT ON COLUMN program_sync_status.device_id IS 'Helps identify which device made the last sync for debugging';