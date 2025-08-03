-- Performance optimization indexes for Flash Sales Dashboard
-- These indexes improve query performance for common access patterns

-- Create indexes for the deals table (main submissions table)
-- Index for filtering by owner (sales rep)
CREATE INDEX IF NOT EXISTS idx_deals_owner_id ON public.deals(owner_id);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(status);

-- Index for filtering by stage
CREATE INDEX IF NOT EXISTS idx_deals_stage ON public.deals(stage);

-- Index for filtering by territory
CREATE INDEX IF NOT EXISTS idx_deals_territory ON public.deals(territory);

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
CREATE INDEX IF NOT EXISTS idx_organizations_industry ON public.organizations(industry);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON public.organizations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_organizations_territory ON public.organizations(territory);

-- Create indexes for contacts table
CREATE INDEX IF NOT EXISTS idx_contacts_organization_id ON public.contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_phone_primary ON public.contacts(phone_primary);
CREATE INDEX IF NOT EXISTS idx_contacts_created_at ON public.contacts(created_at DESC);

-- Create indexes for activities table
CREATE INDEX IF NOT EXISTS idx_activities_deal_id ON public.activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_created_at ON public.activities(created_at DESC);

-- Composite index for activity lookups
CREATE INDEX IF NOT EXISTS idx_activities_deal_user_created ON public.activities(
  deal_id,
  user_id,
  created_at DESC
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- Create indexes for notifications table (if it exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
    CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
    
    -- Composite index for unread notifications
    CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, created_at DESC)
    WHERE is_read = false;
  END IF;
END $$;

-- Analyze tables to update statistics
ANALYZE public.deals;
ANALYZE public.organizations;
ANALYZE public.contacts;
ANALYZE public.activities;
ANALYZE public.users;

-- Create a materialized view for rep performance stats (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS rep_performance_stats AS
WITH user_deals AS (
  SELECT 
    u.id as user_id,
    u.username,
    u.full_name,
    d.id as deal_id,
    d.stage,
    d.amount,
    d.created_at,
    d.close_date
  FROM public.users u
  LEFT JOIN public.deals d ON d.owner_id = u.id
  WHERE u.role IN ('sales_rep', 'Flash Sales Rep')
)
SELECT 
  user_id,
  username,
  full_name,
  COUNT(deal_id) as total_deals,
  COUNT(deal_id) FILTER (WHERE stage = 'closed_won') as won_deals,
  COUNT(deal_id) FILTER (WHERE stage IN ('qualification', 'meeting_scheduled', 'proposal_sent')) as active_deals,
  SUM(amount) FILTER (WHERE stage = 'closed_won') as total_revenue,
  COUNT(deal_id) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as weekly_deals,
  COUNT(deal_id) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_deals,
  MAX(created_at) as last_deal_date
FROM user_deals
GROUP BY user_id, username, full_name;

-- Create index on the materialized view
CREATE INDEX IF NOT EXISTS idx_rep_stats_user_id ON rep_performance_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_rep_stats_username ON rep_performance_stats(username);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_rep_performance_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY rep_performance_stats;
END;
$$ LANGUAGE plpgsql;

-- Comment on the function
COMMENT ON FUNCTION refresh_rep_performance_stats() IS 'Refreshes the rep performance statistics materialized view. Should be called periodically (e.g., every hour) via a cron job.';