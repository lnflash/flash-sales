# Program of Work Migration Instructions

## Overview
This migration adds tables to support hybrid storage of Program of Work data, enabling offline-first functionality while syncing to Supabase for admin visibility.

## Migration File
`/supabase/migrations/20240803_program_of_work_tables.sql`

## How to Apply the Migration

### Option 1: Via Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Go to your project dashboard
   - Navigate to **SQL Editor**

2. **Run the Migration**
   - Click "New Query"
   - Copy the entire contents of `20240803_program_of_work_tables.sql`
   - Paste into the SQL editor
   - Click "Run"

3. **Verify Tables Created**
   ```sql
   -- Run this query to verify
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'program_%'
   ORDER BY table_name;
   ```

   You should see:
   - program_activities
   - program_custom_activity_types
   - program_offline_queue
   - program_sync_status
   - program_weekly_goals

### Option 2: Via Supabase CLI

```bash
# Make sure you're linked to your project
npx supabase link --project-ref [your-project-ref]

# Apply the migration
npx supabase db push
```

## Tables Created

### 1. `program_weekly_goals`
- Stores weekly targets (calls, meetings, proposals, follow-ups)
- One record per user per week

### 2. `program_activities`
- Main table for all program activities
- Includes local_id to match localStorage entries
- Supports custom activity types

### 3. `program_custom_activity_types`
- User-defined activity types
- Tracks usage for smart suggestions

### 4. `program_sync_status`
- Monitors sync health per user
- Helps debug sync issues

### 5. `program_offline_queue`
- Stores changes made while offline
- Processed when connection restored

## Key Features

### Row Level Security (RLS)
- Users can only read/write their own data
- Admins (Flash Management, Flash Admin) can read all data
- Automatic enforcement via RLS policies

### Performance Optimizations
- Indexes on frequently queried columns
- Denormalized username for faster queries
- Efficient date-based queries

### Sync Support
- local_id field maps to localStorage
- Conflict resolution via timestamps
- Offline queue for reliability

## Testing the Migration

### 1. Check User Permissions
```sql
-- As a regular user, you should only see your data
SELECT * FROM program_activities;

-- As admin, you should see all users' data
SELECT DISTINCT username FROM program_activities;
```

### 2. Test Activity Creation
```sql
-- Insert test activity
INSERT INTO program_activities (
  user_id, username, local_id, type, title, date, status
) VALUES (
  auth.uid(), 
  'testuser', 
  'test-' || gen_random_uuid(), 
  'call', 
  'Test Call', 
  CURRENT_DATE, 
  'planned'
);
```

### 3. Verify RLS Policies
```sql
-- This should show RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'program_%';
```

## Next Steps

After migration is applied:

1. **Phase 2**: Implement sync service (`src/services/program-of-work-sync.ts`)
2. **Phase 3**: Update WeeklyProgramStore for hybrid storage
3. **Phase 4**: Add sync UI components
4. **Phase 5**: Update admin views to fetch from Supabase

## Rollback (if needed)

```sql
-- Remove all Program of Work tables
DROP TABLE IF EXISTS program_offline_queue CASCADE;
DROP TABLE IF EXISTS program_sync_status CASCADE;
DROP TABLE IF EXISTS program_custom_activity_types CASCADE;
DROP TABLE IF EXISTS program_activities CASCADE;
DROP TABLE IF EXISTS program_weekly_goals CASCADE;
DROP FUNCTION IF EXISTS get_weekly_activity_summary CASCADE;
DROP FUNCTION IF EXISTS update_activity_completed_at CASCADE;
```

## Notes

- Migration is safe to run multiple times (uses IF NOT EXISTS)
- No existing data is affected
- Tables are empty initially - sync will populate them
- Consider running on staging/test environment first