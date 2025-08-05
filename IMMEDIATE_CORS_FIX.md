# Immediate CORS Fix for Production

## Quick Actions to Fix CORS Error NOW

### 1. In Supabase Dashboard (Do This First!)

1. Go to https://supabase.com/dashboard/project/pgsxczfkjbtgzcauxuur/settings/api
2. Scroll to "CORS Configuration" section
3. Add these URLs to "Allowed Origins":
   ```
   https://intake.flashapp.me
   https://flash-sales-ibb-prod.ondigitalocean.app
   http://localhost:3000
   ```
4. Click "Save"

### 2. In DigitalOcean App Platform

Add these environment variables to your app:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://pgsxczfkjbtgzcauxuur.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU
```

Steps:
1. Go to DigitalOcean App Platform
2. Select your app
3. Go to Settings → Environment Variables
4. Add the variables above
5. Click "Save" and redeploy

### 3. Check RLS Policies (If Still Not Working)

In Supabase SQL Editor, run:

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('organizations', 'contacts', 'deals');

-- If you need a temporary fix (NOT recommended for production):
-- This disables RLS temporarily
-- ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE contacts DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE deals DISABLE ROW LEVEL SECURITY;

-- Better solution: Add proper RLS policies
-- Example policy for deals table
CREATE POLICY "Enable all operations for authenticated users" ON deals
FOR ALL USING (true);
```

### 4. Verify Fix

1. Clear browser cache (important!)
2. Open Chrome DevTools
3. Go to Network tab
4. Try submitting the intake form
5. Check if CORS errors are gone

### If Still Having Issues

The error might be due to RLS policies blocking PATCH operations. You can:

1. **Temporary Fix**: In Supabase Dashboard → Authentication → Policies, temporarily set tables to "No RLS" (not recommended for production)

2. **Proper Fix**: Create RLS policies that allow the operations:
   ```sql
   -- For organizations table
   CREATE POLICY "Allow all for anon" ON organizations
   FOR ALL USING (true);
   
   -- For contacts table  
   CREATE POLICY "Allow all for anon" ON contacts
   FOR ALL USING (true);
   
   -- For deals table
   CREATE POLICY "Allow all for anon" ON deals
   FOR ALL USING (true);
   ```

### Emergency Workaround

If you need it working RIGHT NOW and can't wait:

1. Use the Supabase Dashboard to manually enter data
2. Or temporarily use the old API endpoint if it's still available

### Contact for Help

If none of these work, the issue might be:
- Supabase project is paused (check dashboard)
- API keys are incorrect
- There's a firewall blocking requests

Check Supabase project status at: https://supabase.com/dashboard/project/pgsxczfkjbtgzcauxuur