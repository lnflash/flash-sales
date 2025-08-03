-- Performance optimization indexes for Flash Sales Dashboard
-- These indexes improve query performance for common access patterns

-- Create indexes for the deals table
-- Index for filtering by owner (sales rep)
CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON public.deals(owner_id);

-- Index for filtering by stage
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);

-- Composite index for owner and created_at (common for rep dashboards)
CREATE INDEX IF NOT EXISTS idx_deals_owner_created_at ON public.deals(owner_id, created_at DESC);

-- Index for organization
CREATE INDEX IF NOT EXISTS idx_deals_organization_id ON public.deals(organization_id);

-- Index for primary contact
CREATE INDEX IF NOT EXISTS idx_deals_primary_contact_id ON public.deals(primary_contact_id);

-- Index for created_at to speed up time-based queries
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON public.deals(created_at DESC);

-- Index for updated_at for real-time updates
CREATE INDEX IF NOT EXISTS idx_deals_updated_at ON public.deals(updated_at DESC);

-- Partial index for deals in qualification stage
CREATE INDEX IF NOT EXISTS idx_deals_qualification ON public.deals(created_at DESC)
WHERE stage = 'qualification';

-- Partial index for won deals
CREATE INDEX IF NOT EXISTS idx_deals_won ON public.deals(close_date DESC)
WHERE stage = 'closed_won';

-- Create indexes for organizations table
CREATE INDEX IF NOT EXISTS idx_organizations_name ON public.organizations(name);

-- Only create industry index if column exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'industry'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_organizations_industry ON public.organizations(industry);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON public.organizations(created_at DESC);

-- Only create territory index if column exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organizations' AND column_name = 'territory'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_organizations_territory ON public.organizations(territory);
  END IF;
END $$;

-- Create indexes for contacts table
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON public.contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);

-- Only create phone index if column exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contacts' AND column_name = 'phone_primary'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_contacts_phone_primary ON public.contacts(phone_primary);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts(created_at DESC);

-- Create indexes for activities table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
    CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
    CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);
    
    -- Only create other indexes if columns exist
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'activities' AND column_name = 'deal_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON public.activities(deal_id);
    END IF;
    
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'activities' AND column_name = 'type'
    ) THEN
      CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);
    END IF;
  END IF;
END $$;

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Only create username index if column exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'username'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
  END IF;
END $$;

-- Only create role index if column exists
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
  END IF;
END $$;

-- Analyze tables to update statistics
ANALYZE public.deals;
ANALYZE public.organizations;
ANALYZE public.contacts;
ANALYZE public.users;

-- Only analyze activities if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
    ANALYZE public.activities;
  END IF;
END $$;

-- Create a simple materialized view for rep performance stats
-- This is defensive and only uses columns we know exist
DO $$ 
BEGIN
  -- Drop existing view if it exists
  DROP MATERIALIZED VIEW IF EXISTS rep_performance_stats;
  
  -- Only create if we have the necessary columns
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    CREATE MATERIALIZED VIEW rep_performance_stats AS
    WITH user_deals AS (
      SELECT 
        u.id as user_id,
        u.email,
        d.id as deal_id,
        d.stage,
        d.amount,
        d.created_at,
        d.close_date
      FROM public.users u
      LEFT JOIN public.deals d ON d.owner_id = u.id
      WHERE EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
      ) AND u.role IN ('sales_rep', 'Flash Sales Rep')
    )
    SELECT 
      user_id,
      email,
      COUNT(deal_id) as total_deals,
      COUNT(deal_id) FILTER (WHERE stage = 'closed_won') as won_deals,
      COUNT(deal_id) FILTER (WHERE stage IN ('qualification', 'meeting_scheduled', 'proposal_sent')) as active_deals,
      COALESCE(SUM(amount) FILTER (WHERE stage = 'closed_won'), 0) as total_revenue,
      COUNT(deal_id) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as weekly_deals,
      COUNT(deal_id) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_deals,
      MAX(created_at) as last_deal_date
    FROM user_deals
    GROUP BY user_id, email;

    -- Create indexes on the materialized view
    CREATE INDEX idx_rep_stats_user_id ON rep_performance_stats(user_id);
  END IF;
END $$;

-- Create a function to refresh the materialized view (if it was created)
CREATE OR REPLACE FUNCTION refresh_rep_performance_stats()
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_matviews WHERE matviewname = 'rep_performance_stats') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY rep_performance_stats;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Comment on the function
COMMENT ON FUNCTION refresh_rep_performance_stats() IS 'Refreshes the rep performance statistics materialized view. Should be called periodically (e.g., every hour) via a cron job.';