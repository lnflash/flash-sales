# Production Login Fix

## The Problem
The production site (intake.flashapp.me) cannot connect to authentication because the Supabase credentials are missing from the production environment.

## Solution

### For Vercel Deployment:
1. Go to your Vercel Dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add these variables for Production:

```
NEXT_PUBLIC_SUPABASE_URL=https://pgsxczfkjbtgzcauxuur.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5OTMzNywiZXhwIjoyMDY5Mjc1MzM3fQ.20zaENouwzL4LtcjubvWSKtRaq852Gdpu5xDP9Ylftg
```

5. Redeploy the application

### For Other Hosting Providers:
Add the same environment variables to your hosting platform's environment configuration.

### Alternative: Update .env.production
If you control the deployment, update `.env.production`:

```bash
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_API_BASE_URL=/api
NEXT_PUBLIC_USE_SUPABASE=true

# Add these:
NEXT_PUBLIC_SUPABASE_URL=https://pgsxczfkjbtgzcauxuur.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2OTkzMzcsImV4cCI6MjA2OTI3NTMzN30.Wivrr3OfYUcaa4RoTak7oBwjnUSC0QwebVpFSvq5PcU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBnc3hjemZramJ0Z3pjYXV4dXVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzY5OTMzNywiZXhwIjoyMDY5Mjc1MzM3fQ.20zaENouwzL4LtcjubvWSKtRaq852Gdpu5xDP9Ylftg
```

## Security Note
In production, it's better to:
1. Use environment variables from your hosting platform
2. Consider using different Supabase projects for dev/staging/production
3. Never commit service role keys to git

## Quick Test
After adding the environment variables and redeploying:
1. Visit intake.flashapp.me/login
2. You should be able to log in with your Supabase credentials
3. The error message should disappear