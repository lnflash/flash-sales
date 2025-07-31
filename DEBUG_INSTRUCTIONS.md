# Debug Instructions for Rep Dashboard Filtering

## To debug the filtering issue, please follow these steps:

1. **Open the browser console** (Right-click → Inspect → Console tab)

2. **Check what's in localStorage:**
   ```javascript
   // Copy and paste this into the console:
   const userData = localStorage.getItem('flash_dashboard_user');
   if (userData) {
     const user = JSON.parse(userData);
     console.log('User data:', user);
     console.log('Username:', user.username);
     console.log('Username length:', user.username.length);
   }
   ```

3. **Check the network tab:**
   - Go to Network tab in Developer Tools
   - Refresh the dashboard page
   - Look for requests to Supabase (should contain 'supabase' in the URL)
   - Click on the request and check:
     - Request headers
     - Response data
     - Look for any error messages

4. **Check the console for debug messages:**
   - The dashboard now logs debug information
   - Look for messages like:
     - "Looking up user ID for username: 'charms'"
     - "User lookup result:"
     - "Found user ID for username"
     - "Rep Dashboard Debug:"

5. **Verify the username in the database:**
   Run this SQL query in Supabase SQL Editor:
   ```sql
   SELECT id, username, email 
   FROM users 
   WHERE username ILIKE '%charms%' 
      OR email ILIKE '%charms%';
   ```

## What we've fixed:

1. **Case-insensitive username lookup** - Now uses `ilike` instead of `eq`
2. **Whitespace trimming** - Usernames are trimmed before lookup
3. **Added debug logging** - Console shows detailed filtering information
4. **Fixed filtering logic** - Always filters by logged-in user unless admin selects another

## Expected behavior:

- User 'charms' should see exactly 113 submissions
- The dashboard title should show "charms's Dashboard"
- The submission count should show "Your Submissions: 113"
- No other users' submissions should appear in any section

## If still seeing 763 submissions:

1. Hard refresh the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)
2. Clear browser cache and cookies for the site
3. Log out and log back in
4. Check if the deployment has completed on DigitalOcean