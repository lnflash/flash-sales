-- Fix Program of Work tables RLS policies and missing columns
-- This fixes the 406 errors and missing column issues

-- 1. First, ensure program_sync_status table exists with all required columns
CREATE TABLE IF NOT EXISTS program_sync_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    sync_status TEXT DEFAULT 'idle',
    customTypesSynced BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add the missing column if table already exists
ALTER TABLE program_sync_status 
ADD COLUMN IF NOT EXISTS customTypesSynced BOOLEAN DEFAULT false;

-- 2. Fix RLS for program_sync_status
ALTER TABLE program_sync_status ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own sync status" ON program_sync_status;
DROP POLICY IF EXISTS "Users can insert their own sync status" ON program_sync_status;
DROP POLICY IF EXISTS "Users can update their own sync status" ON program_sync_status;
DROP POLICY IF EXISTS "Users can delete their own sync status" ON program_sync_status;

-- Create new policies
CREATE POLICY "Users can view their own sync status" 
ON program_sync_status FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync status" 
ON program_sync_status FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync status" 
ON program_sync_status FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync status" 
ON program_sync_status FOR DELETE 
USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON program_sync_status TO authenticated;

-- 3. Ensure program_weekly_goals table exists
CREATE TABLE IF NOT EXISTS program_weekly_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    goals JSONB DEFAULT '[]'::jsonb,
    revenue_goals JSONB DEFAULT '{}'::jsonb,
    conversion_goals JSONB DEFAULT '{}'::jsonb,
    activity_goals JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

-- 4. Fix RLS for program_weekly_goals
ALTER TABLE program_weekly_goals ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own goals" ON program_weekly_goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON program_weekly_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON program_weekly_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON program_weekly_goals;

-- Create new policies
CREATE POLICY "Users can view their own goals" 
ON program_weekly_goals FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals" 
ON program_weekly_goals FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals" 
ON program_weekly_goals FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals" 
ON program_weekly_goals FOR DELETE 
USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON program_weekly_goals TO authenticated;

-- 5. Ensure program_tasks table exists
CREATE TABLE IF NOT EXISTS program_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    category TEXT,
    due_date DATE,
    completed_at TIMESTAMPTZ,
    notes TEXT,
    tags TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Fix RLS for program_tasks
ALTER TABLE program_tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own tasks" ON program_tasks;
DROP POLICY IF EXISTS "Users can insert their own tasks" ON program_tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON program_tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON program_tasks;

-- Create new policies
CREATE POLICY "Users can view their own tasks" 
ON program_tasks FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" 
ON program_tasks FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
ON program_tasks FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
ON program_tasks FOR DELETE 
USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON program_tasks TO authenticated;

-- 7. Ensure program_custom_types table exists
CREATE TABLE IF NOT EXISTS program_custom_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    type_category TEXT NOT NULL, -- 'bitcoin_type', 'merchant_type', 'weekly_summary'
    name TEXT NOT NULL,
    color TEXT,
    icon TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, type_category, name)
);

-- 8. Fix RLS for program_custom_types
ALTER TABLE program_custom_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own custom types" ON program_custom_types;
DROP POLICY IF EXISTS "Users can insert their own custom types" ON program_custom_types;
DROP POLICY IF EXISTS "Users can update their own custom types" ON program_custom_types;
DROP POLICY IF EXISTS "Users can delete their own custom types" ON program_custom_types;

-- Create new policies
CREATE POLICY "Users can view their own custom types" 
ON program_custom_types FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own custom types" 
ON program_custom_types FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own custom types" 
ON program_custom_types FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own custom types" 
ON program_custom_types FOR DELETE 
USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON program_custom_types TO authenticated;

-- 9. Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 10. Verify tables and policies
SELECT 
    'Tables created/updated successfully' as status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('program_sync_status', 'program_weekly_goals', 'program_tasks', 'program_custom_types');

-- Check if customTypesSynced column exists
SELECT 
    'customTypesSynced column status' as check_type,
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'program_sync_status' 
        AND column_name = 'customtypessynced'
    ) as exists;