# DigitalOcean App Platform Environment Variables

## Required Environment Variables for Production

In your DigitalOcean App Platform settings, ensure these environment variables are set:

### Core Variables
```
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_APP_URL=https://intake.flashapp.me
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_USE_SUPABASE=true
```

### Supabase Variables
```
NEXT_PUBLIC_SUPABASE_URL=https://pgsxczfkjbtgzcauxuur.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5OTMzNywiZXhwIjoyMDY5Mjc1MzM3fQ.20zaENouwzL4LtcjubvWSKtRaq852Gdpu5xDP9Ylftg
```

## How to Update in DigitalOcean

1. Go to DigitalOcean Control Panel
2. Navigate to Apps → Your App
3. Go to Settings → App-Level Environment Variables
4. Update/Add the variables above
5. Click Save
6. Deploy the changes

## Important Notes

- The `NEXT_PUBLIC_APP_URL` should match your custom domain (https://intake.flashapp.me)
- NOT the DigitalOcean app URL (https://flash-sales-dashboard-p8qei.ondigitalocean.app)
- This is important for:
  - Authentication redirects
  - CORS settings
  - API calls
  - Cookie domains

## Verify After Deployment

1. Clear browser cache/cookies
2. Visit https://intake.flashapp.me/login
3. Check browser console for any errors
4. Verify authentication works correctly