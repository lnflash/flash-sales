-- Fix database schema errors for program_sync_status and program_weekly_goals
-- This script adds missing columns and fixes RLS policies

-- 1. Add customTypesSynced column to program_sync_status if it doesn't exist
ALTER TABLE program_sync_status 
ADD COLUMN IF NOT EXISTS customTypesSynced BOOLEAN DEFAULT false;

-- 2. Ensure program_weekly_goals table exists with all required columns
CREATE TABLE IF NOT EXISTS program_weekly_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    username TEXT,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    goals JSONB DEFAULT '{}',
    progress JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Add any missing columns to program_weekly_goals
ALTER TABLE program_weekly_goals 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE program_weekly_goals 
ADD COLUMN IF NOT EXISTS username TEXT;

ALTER TABLE program_weekly_goals 
ADD COLUMN IF NOT EXISTS goals JSONB DEFAULT '{}';

ALTER TABLE program_weekly_goals 
ADD COLUMN IF NOT EXISTS progress JSONB DEFAULT '{}';

-- 4. Fix RLS policies for program_sync_status
ALTER TABLE program_sync_status ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for program_sync_status" ON program_sync_status;
CREATE POLICY "Allow all for program_sync_status" 
ON program_sync_status 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 5. Fix RLS policies for program_weekly_goals
ALTER TABLE program_weekly_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for program_weekly_goals" ON program_weekly_goals;
CREATE POLICY "Allow all for program_weekly_goals" 
ON program_weekly_goals 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_program_sync_status_user_id ON program_sync_status(user_id);
CREATE INDEX IF NOT EXISTS idx_program_sync_status_username ON program_sync_status(username);
CREATE INDEX IF NOT EXISTS idx_program_weekly_goals_user_id ON program_weekly_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_program_weekly_goals_username ON program_weekly_goals(username);
CREATE INDEX IF NOT EXISTS idx_program_weekly_goals_week_start ON program_weekly_goals(week_start);

-- 7. Refresh the PostgREST schema cache
NOTIFY pgrst, 'reload schema';

-- 8. Grant permissions
GRANT ALL ON program_sync_status TO anon, authenticated;
GRANT ALL ON program_weekly_goals TO anon, authenticated;