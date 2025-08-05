# Fix Production CORS Error

## Problem
The intake form at https://intake.flashapp.me is getting CORS errors when trying to submit data to Supabase:
```
Access to fetch at 'https://pgsxczfkjbtgzcauxuur.supabase.co/rest/v1/...' from origin 'https://intake.flashapp.me' has been blocked by CORS policy: Method PATCH is not allowed by Access-Control-Allow-Methods in preflight response.
```

## Root Cause
The Supabase environment variables are not configured in production. The app is trying to use Supabase but doesn't have the proper credentials.

## Solution

### 1. Add Supabase Environment Variables to Production

Add these environment variables to your production deployment (DigitalOcean App Platform):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://pgsxczfkjbtgzcauxuur.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU
```

**Note:** Never add the `SUPABASE_SERVICE_ROLE_KEY` to client-side environment variables!

### 2. Configure Supabase CORS Settings

In your Supabase dashboard:

1. Go to Settings → API
2. Under "CORS Allowed Origins", add:
   - `https://intake.flashapp.me`
   - `https://flash-sales-ibb-prod.ondigitalocean.app`
   - Any other production domains you're using

3. Make sure "Allow all origins" is NOT checked for security

### 3. Update .env.production

Create/update `.env.production` with:

```bash
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_USE_SUPABASE=true
NEXT_PUBLIC_SUPABASE_URL=https://pgsxczfkjbtgzcauxuur.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU
```

### 4. Alternative: Use API Proxy

If CORS issues persist, you can route Supabase calls through your Next.js API:

1. Create `/pages/api/supabase-proxy.ts`
2. Route all Supabase calls through this endpoint
3. The server-side API won't have CORS issues

### 5. Verify RLS Policies

Make sure your Supabase Row Level Security (RLS) policies allow:
- INSERT for new submissions
- UPDATE for existing submissions
- SELECT for reading data

Check these tables:
- `organizations`
- `contacts`
- `deals`

### 6. Deploy Changes

1. Commit the updated `.env.production`
2. Push to GitHub
3. Ensure DigitalOcean App Platform has the environment variables
4. Redeploy the application

## Quick Fix (Temporary)

If you need an immediate fix, you can:

1. Disable RLS temporarily on the affected tables (NOT recommended for production)
2. Use the Supabase dashboard to manually configure CORS origins
3. Check if the anon key has the proper permissions

## Testing

After deployment:
1. Clear browser cache
2. Try submitting the intake form
3. Check browser console for any remaining CORS errors
4. Verify data is being saved to Supabase

## Security Notes

- Never expose `SUPABASE_SERVICE_ROLE_KEY` in client-side code
- Always use RLS policies in production
- Limit CORS origins to your actual domains only