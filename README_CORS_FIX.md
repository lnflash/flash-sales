# CORS Fix for Profile Updates

## Problem
When saving profile changes (especially default territory), you're getting a CORS error because PATCH requests from https://intake.flashapp.me are blocked by Supabase CORS policy.

## Solution
We've implemented an RPC function workaround that bypasses CORS restrictions.

## Steps to Apply the Fix

1. **Apply the SQL function to your Supabase database:**
   
   Run the following SQL in your Supabase SQL editor:
   ```bash
   # The SQL is located at:
   src/scripts/create-update-profile-function.sql
   ```

2. **The application code has already been updated** to use this RPC function instead of direct PATCH requests.

3. **How it works:**
   - Instead of using direct PATCH requests (which are blocked by CORS)
   - The app now calls the `update_user_profile` RPC function
   - RPC functions are not subject to the same CORS restrictions
   - If the function doesn't exist yet, it falls back to the direct update method

## Alternative Solution
If you have access to Supabase Dashboard:
1. Go to Settings > API
2. Add https://intake.flashapp.me to the allowed origins
3. Ensure PATCH is included in allowed methods

## Testing
After applying the SQL function, test by:
1. Going to the profile page
2. Changing your default territory
3. Clicking Save
4. The update should now work without CORS errors