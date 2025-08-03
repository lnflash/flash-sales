# Caribbean Territory Migration Instructions

## Manual Migration Steps

Since we need database access, please follow these steps to apply the Caribbean territory migration:

### Step 1: Access Supabase SQL Editor

1. Go to your Supabase Dashboard
2. Navigate to: https://supabase.com/dashboard/project/pgsxczfkjbtgzcauxuur/sql/new
3. Or click: SQL Editor → New Query

### Step 2: Apply the Migration

1. Open the file: `supabase/migrations/20240803_caribbean_territories.sql`
2. Copy the entire contents
3. Paste into the SQL editor
4. Click "Run" or press Cmd/Ctrl + Enter

### Step 3: Verify the Migration

After running the migration, run this verification query:

```sql
-- Check countries
SELECT code, name, flag_emoji, currency_code 
FROM countries 
ORDER BY name;

-- Check territories
SELECT 
  c.flag_emoji,
  c.name as country,
  t.name as territory,
  t.type,
  t.level
FROM territories t
JOIN countries c ON t.country_id = c.id
ORDER BY c.name, t.level, t.name
LIMIT 20;

-- Check hierarchy view
SELECT * FROM territory_hierarchy 
WHERE country_code IN ('JM', 'KY', 'CW')
LIMIT 10;
```

### Expected Results

You should see:
- 3 countries: Jamaica (JM), Cayman Islands (KY), Curaçao (CW)
- 14 parishes for Jamaica
- 7 districts for Cayman Islands
- 3 districts for Curaçao
- Several sub-areas for business districts

### Step 4: Test the Implementation

Once the migration is applied:

```bash
# Run the territory test script
npm run test:territories
```

This will verify that all tables and data are properly set up.

## Troubleshooting

### If you get permission errors:
- Make sure you're using the service role key in your .env.local
- Check that RLS policies are properly set

### If tables already exist:
- You can drop and recreate them:
```sql
DROP TABLE IF EXISTS territory_assignments CASCADE;
DROP TABLE IF EXISTS territories CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
```

### If you need to rollback:
```sql
-- Remove new columns from deals
ALTER TABLE deals 
  DROP COLUMN IF EXISTS territory_id,
  DROP COLUMN IF EXISTS detected_country,
  DROP COLUMN IF EXISTS detected_region;

-- Drop tables
DROP TABLE IF EXISTS territory_assignments CASCADE;
DROP TABLE IF EXISTS territories CASCADE;
DROP TABLE IF EXISTS countries CASCADE;
DROP VIEW IF EXISTS territory_hierarchy CASCADE;
DROP FUNCTION IF EXISTS get_territory_stats CASCADE;
```

## Next Steps

After successful migration:
1. The territory tables will be ready
2. Existing Jamaica data will be preserved
3. New countries (Cayman & Curaçao) will be available
4. You can start testing the UI components

## Alternative: Using Supabase CLI

If you have the Supabase CLI properly configured:

```bash
# Link to your project
supabase link --project-ref pgsxczfkjbtgzcauxuur

# Push the migration
supabase db push

# Or reset and apply all migrations
supabase db reset
```

Note: This requires your database password.