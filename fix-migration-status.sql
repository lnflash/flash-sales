-- Check current migration status
SELECT * FROM supabase_migrations.schema_migrations 
WHERE name LIKE '%fix_owners_and_territories%' 
   OR name LIKE '%program_of_work%'
ORDER BY version DESC;

-- If you need to remove duplicate or failed migrations, uncomment and run:
-- DELETE FROM supabase_migrations.schema_migrations 
-- WHERE name = '20240730_fix_owners_and_territories_generated.sql';

-- Check if Program of Work tables already exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('program_activities', 'program_weekly_goals', 'program_custom_activity_types', 'program_sync_status', 'program_offline_queue')
ORDER BY table_name;

-- Check if the fixes were already applied
SELECT COUNT(*) as deals_with_owners FROM deals WHERE owner_id IS NOT NULL;
SELECT COUNT(*) as orgs_with_territories FROM organizations WHERE state_province IS NOT NULL AND state_province != '';