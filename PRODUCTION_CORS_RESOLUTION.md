# Production CORS Resolution Guide

## Current Status
Our diagnostic tests show that CORS is properly configured on Supabase's end:
- ✅ All HTTP methods (GET, POST, PUT, PATCH, DELETE) are allowed
- ✅ The origin `https://intake.flashapp.me` is properly configured
- ✅ Direct API calls work correctly

## Most Likely Causes

### 1. Environment Variables Not Loading
The production app might not be loading the Supabase configuration correctly.

**Action Required:**
1. SSH into your DigitalOcean app or check the app logs
2. Verify these environment variables are set:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://pgsxczfkjbtgzcauxuur.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU
   ```

### 2. Browser Cache Issues
The browser might be caching old CORS responses.

**Action Required:**
1. Clear browser cache completely
2. Try in an incognito/private window
3. Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

### 3. Client-Side Supabase Initialization
The Supabase client might be initialized with incorrect values.

**Check in Browser Console:**
```javascript
// Open Chrome DevTools on https://intake.flashapp.me
// Run this in the console:
console.log(window.__NEXT_DATA__.props.pageProps)
```

## Immediate Solutions

### Option 1: Force Rebuild and Redeploy
```bash
# In DigitalOcean App Platform:
1. Go to your app settings
2. Click "Force Rebuild & Deploy"
3. Wait for deployment to complete
```

### Option 2: Use the API Proxy (Already Implemented)
The intake form can use the proxy endpoint we created:

```javascript
// Instead of direct Supabase calls, use:
const response = await fetch('/api/supabase-proxy/organizations', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data)
});
```

### Option 3: Add Debug Logging
Add this to your intake form to debug:

```javascript
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Has Anon Key:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
```

## Verification Steps

1. **Check Network Tab**
   - Open Chrome DevTools → Network tab
   - Try submitting the form
   - Look for the failed request
   - Check the request headers (especially Origin)
   - Check the response headers

2. **Test Direct API Call**
   - Open console on https://intake.flashapp.me
   - Run:
   ```javascript
   fetch('https://pgsxczfkjbtgzcauxuur.supabase.co/rest/v1/organizations', {
     method: 'GET',
     headers: {
       'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU'
     }
   }).then(r => console.log('Status:', r.status))
   ```

3. **Check Supabase Client Version**
   - Ensure you're using a recent version of @supabase/supabase-js
   - Check package.json for the version

## If All Else Fails

1. **Temporary Workaround**
   Use the proxy API we created by updating the intake form to route through `/api/supabase-proxy/`

2. **Contact Supabase Support**
   - Project ID: pgsxczfkjbtgzcauxuur
   - Issue: CORS working in tests but not from production app
   - Include the network request/response headers

3. **Alternative Deployment**
   - Try deploying to Vercel temporarily to isolate if it's a DigitalOcean-specific issue