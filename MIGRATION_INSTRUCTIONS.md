# PIN Authentication Migration Instructions

The PIN authentication system requires database schema changes. Follow these steps to apply the migration:

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard/project/pgsxczfkjbtgzcauxuur

2. Navigate to the SQL Editor (Database → SQL Editor)

3. Copy and paste the migration SQL from `supabase/migrations/20250106_add_pin_authentication.sql`

4. Click "Run" to execute the migration

## Option 2: Using Supabase CLI

```bash
# Login to Supabase (if not already logged in)
npx supabase login

# Link to your project
npx supabase link --project-ref pgsxczfkjbtgzcauxuur

# Push the migration
npx supabase db push
```

## Option 3: Direct SQL Connection

If you have direct database access, you can run:

```bash
psql -h aws-0-us-east-1.pooler.supabase.com -p 5432 -d postgres -U postgres.pgsxczfkjbtgzcauxuur -f supabase/migrations/20250106_add_pin_authentication.sql
```

## Verify Migration

After running the migration, verify it worked by checking if the PIN columns exist:

1. Go to Table Editor in Supabase Dashboard
2. Open the `users` table
3. Check for these new columns:
   - `pin_hash`
   - `pin_set_at`
   - `pin_attempts`
   - `pin_locked_until`
   - `pin_recovery_token`
   - `pin_recovery_expires`
   - `pin_required`

4. Check that the `pin_attempt_logs` table was created

## Troubleshooting

If you get errors about columns already existing, the migration may have partially applied. In this case:

1. Check which columns already exist
2. Modify the migration SQL to only add missing columns
3. Re-run the modified migration

## After Migration

Once the migration is complete, the PIN authentication system will work properly. Users will be able to:
- Set up their 4-digit PIN on first login
- Use their PIN for authentication
- Change their PIN in Profile settings
- Reset their PIN if forgotten