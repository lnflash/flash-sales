# Fix Missing Tables in Supabase

The application is getting 404 errors because some required tables are missing from your Supabase database:
- `enrichment_cache` - Stores cached Google Places API results
- `program_weekly_goals` - Stores weekly program goals
- `program_sync_status` - Stores sync status for offline support

## Quick Fix

1. Go to your Supabase dashboard
2. Click on "SQL Editor" in the left sidebar
3. Copy and paste the entire contents of `sql/create_missing_tables.sql`
4. Click "Run" to execute the SQL

## Alternative: Using Command Line

If you have the Supabase CLI or PostgreSQL client installed:

```bash
# Set your database URL (get this from Supabase dashboard > Settings > Database)
export SUPABASE_DB_URL="postgresql://postgres:your-password@db.pgsxczfkjbtgzcauxuur.supabase.co:5432/postgres"

# Run the script
./scripts/create-missing-tables.sh
```

## What This Fixes

1. **Company Information Not Loading**: The enrichment_cache table stores Google Places API results
2. **404 Errors in Console**: All the missing table errors will be resolved
3. **Weekly Program Issues**: The program tables support the weekly program feature

After running the SQL, refresh your application and the company information should start populating correctly when you type business names.
EOF < /dev/null