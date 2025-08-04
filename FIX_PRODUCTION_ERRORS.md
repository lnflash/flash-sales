# Production Error Fixes

## Issues Identified

1. **Missing database columns**: `activitiesSynced` column missing from `program_sync_status`
2. **Missing table**: `program_weekly_goals` table not found (406 error)
3. **CORS errors**: PATCH requests blocked for anon users
4. **Form submission failing**: Deal creation returns 400 error

## Quick Fix Steps

### 1. Run Database Fix Script

Go to your Supabase dashboard > SQL Editor and run:

```sql
-- Copy and paste the entire contents of:
-- src/scripts/fix-production-errors.sql
```

This script will:
- Add missing columns to `program_sync_status`
- Create `program_weekly_goals` table
- Set up proper RLS policies for anon access
- Create RPC functions as CORS workarounds
- Grant full permissions to anon role

### 2. Enable CORS for PATCH requests (Supabase Dashboard)

1. Go to Supabase Dashboard > Settings > API
2. Under "CORS Configuration", ensure these are allowed:
   - Allowed Origins: Include your domain (https://intake.flashapp.me)
   - Allowed Methods: GET, POST, PATCH, DELETE, OPTIONS
   - Allowed Headers: Include all default headers

### 3. Alternative: Use RPC Functions (Already implemented in script)

The script creates RPC functions that can be called instead of PATCH:
- `update_organization()`
- `update_contact()`
- `update_deal()`

These bypass CORS issues by using POST requests to RPC endpoints.

## Testing

After running the fixes:

1. Test the intake form submission
2. Check that Weekly Program page loads without errors
3. Verify data syncing works properly

## Long-term Solution

Consider migrating from direct table access to RPC functions for all write operations to avoid CORS issues with the anon role.