# Supabase Setup Guide for Flash CRM

## Prerequisites
- Supabase account (create at https://supabase.com)
- PostgreSQL client (optional but helpful): psql, TablePlus, or DBeaver
- Node.js 18+ installed locally

## Step 1: Create Supabase Project

1. **Sign in to Supabase Dashboard**
   - Go to https://app.supabase.com
   - Create a new project
   - Project name: `flash-crm-production` (or `flash-crm-dev` for development)
   - Database password: Generate a strong password and save it securely
   - Region: Choose closest to your users (e.g., `us-east-1` for US East Coast)
   - Pricing plan: Start with Free tier, upgrade to Pro ($25/month) when ready

2. **Wait for Project Provisioning**
   - Takes about 2 minutes
   - Note down these values from Settings > API:
     - Project URL: `https://[PROJECT_ID].supabase.co`
     - Anon/Public key: `eyJ...` (safe for client-side)
     - Service key: `eyJ...` (server-side only, keep secret!)

## Step 2: Enable Required Extensions

1. **Navigate to SQL Editor** in Supabase Dashboard
2. **Run the following commands** one by one:

```sql
-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable fuzzy text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enable vector embeddings for AI (if not available, skip for now)
CREATE EXTENSION IF NOT EXISTS "vector";
```

## Step 3: Schema Setup

### Option A: Using Supabase Dashboard (Recommended)

1. **Go to SQL Editor**
2. **Create a new query**
3. **Copy the schema** from `IMPROVED_CRM_SCHEMA.sql`
4. **Execute in chunks**:
   - First, run the extensions (already done)
   - Then create tables in order:
     - Teams table first
     - Users table
     - Organizations table
     - Contacts table
     - Pipelines table
     - Deals table
     - Activities table
     - All other tables
   - Finally, create functions, triggers, and policies

### Option B: Using Supabase CLI (Advanced)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Initialize project
supabase init

# Link to your project
supabase link --project-ref [PROJECT_ID]

# Create migration
supabase migration new create_crm_schema

# Copy schema to migration file
cp IMPROVED_CRM_SCHEMA.sql supabase/migrations/[TIMESTAMP]_create_crm_schema.sql

# Run migration
supabase db push
```

## Step 4: Configure Authentication

1. **Go to Authentication > Providers**
2. **Enable Email provider** (for now)
3. **Configure email templates**:
   - Customize confirmation emails
   - Set redirect URLs to your dashboard

4. **Create initial admin user**:
```sql
-- Run in SQL Editor after enabling auth
INSERT INTO auth.users (
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at
) VALUES (
  'admin@flashbitcoin.com',
  crypt('temporary_password_change_me', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW()
) RETURNING id;

-- Note the returned ID and create user record
INSERT INTO public.users (
  auth_id,
  email,
  first_name,
  last_name,
  role
) VALUES (
  '[AUTH_ID_FROM_ABOVE]',
  'admin@flashbitcoin.com',
  'Admin',
  'User',
  'admin'
);
```

## Step 5: Configure Storage

1. **Go to Storage**
2. **Create buckets**:
```sql
-- Run in SQL Editor
INSERT INTO storage.buckets (id, name, public) VALUES
  ('avatars', 'avatars', true),
  ('logos', 'logos', true),
  ('attachments', 'attachments', false);
```

3. **Set up storage policies**:
```sql
-- Allow authenticated users to upload their own avatar
CREATE POLICY "Users can upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public to view avatars and logos
CREATE POLICY "Public can view avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id IN ('avatars', 'logos'));
```

## Step 6: Set Up Real-time

1. **Enable real-time for tables** (already in schema)
2. **Configure real-time settings**:
   - Go to Settings > API
   - Under Realtime, ensure it's enabled
   - Set rate limits if needed

## Step 7: Configure Row Level Security (RLS)

1. **Test RLS is working**:
```sql
-- Should return no rows when accessed as anon
SELECT * FROM organizations;
```

2. **Create service role for migrations**:
```sql
-- Create a service role that bypasses RLS for data migration
-- Use this carefully and only during migration
```

## Step 8: Environment Configuration

1. **Create `.env.local` file**:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_ENV=development

# Legacy API (for migration period)
INTAKE_API_URL=https://flash-intake-form-3xgvo.ondigitalocean.app/api
```

2. **Update `.env.production`**:
```bash
# Production values
NEXT_PUBLIC_SUPABASE_URL=https://[PROD_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
NEXT_PUBLIC_APP_URL=https://dashboard.flashbitcoin.com
NEXT_PUBLIC_APP_ENV=production
```

## Step 9: Install Supabase Client

```bash
# Install Supabase client libraries
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-helpers-react

# Install additional dependencies for real-time
npm install @supabase/realtime-js
```

## Step 10: Create Supabase Client Configuration

Create `src/lib/supabase.ts`:
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// For server-side operations (use carefully)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      persistSession: false,
    },
  }
);
```

## Step 11: Generate TypeScript Types

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Generate types from your database
supabase gen types typescript --project-id [PROJECT_ID] > src/types/database.ts
```

## Step 12: Test the Connection

Create `src/lib/supabase-test.ts`:
```typescript
import { supabase } from './supabase';

export async function testConnection() {
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('organizations')
      .select('count')
      .single();
    
    if (error) {
      console.error('Connection test failed:', error);
      return false;
    }
    
    console.log('Connection successful!');
    return true;
  } catch (err) {
    console.error('Connection test error:', err);
    return false;
  }
}
```

## Step 13: Data Migration Preparation

1. **Create migration tracking table**:
```sql
CREATE TABLE migration_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  migration_name TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  records_processed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

2. **Prepare migration script** (see `MIGRATION_SCRIPT.ts`)

## Step 14: Security Checklist

- [ ] RLS enabled on all tables
- [ ] Service role key not exposed to client
- [ ] API keys in environment variables
- [ ] CORS configured for your domain
- [ ] Rate limiting configured
- [ ] Backup policy enabled (Pro plan)

## Step 15: Monitoring Setup

1. **Enable Logging**:
   - Go to Settings > Logs
   - Enable query logs for debugging

2. **Set up Alerts** (Pro plan):
   - Database size alerts
   - API rate limit alerts
   - Error rate alerts

## Common Issues & Solutions

### Issue: "permission denied for schema public"
**Solution**: Make sure you're using the correct role:
```sql
GRANT ALL ON SCHEMA public TO postgres;
GRANT CREATE ON SCHEMA public TO postgres;
```

### Issue: "extension vector does not exist"
**Solution**: Vector extension might not be available on free tier. Comment out vector-related code for now:
```sql
-- CREATE EXTENSION IF NOT EXISTS "vector";
-- Comment out transcript_embedding column in conversation_intelligence table
```

### Issue: RLS blocking all queries
**Solution**: For development, you can temporarily disable RLS:
```sql
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
-- Remember to re-enable for production!
```

## Next Steps

1. Run the migration script to import existing data
2. Update the frontend to use Supabase client instead of REST API
3. Implement real-time subscriptions
4. Add authentication flow
5. Set up automated backups

## Useful Supabase SQL Snippets

```sql
-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- View current RLS policies
SELECT * FROM pg_policies;

-- Check real-time subscriptions
SELECT * FROM realtime.subscription;
```

## Support Resources

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Status Page: https://status.supabase.com
- Support (Pro plan): support@supabase.com