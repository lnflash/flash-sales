-- Performance optimization indexes for Flash Sales Dashboard
-- These indexes improve query performance for common access patterns

-- Create indexes for the deals table (main submissions table)
-- Index for filtering by username (sales rep)
CREATE INDEX IF NOT EXISTS idx_deals_username ON public.deals(username);

-- Index for filtering by status
CREATE INDEX IF NOT EXISTS idx_deals_status ON public.deals(status);

-- Index for filtering by signed_up status
CREATE INDEX IF NOT EXISTS idx_deals_signed_up ON public.deals(signed_up);

-- Index for filtering by territory
CREATE INDEX IF NOT EXISTS idx_deals_territory ON public.deals(territory);

-- Composite index for username and created_at (common for rep dashboards)
CREATE INDEX IF NOT EXISTS idx_deals_username_created_at ON public.deals(username, created_at DESC);

-- Index for interest level queries
CREATE INDEX IF NOT EXISTS idx_deals_interest_level ON public.deals(interest_level);

-- Index for business type
CREATE INDEX IF NOT EXISTS idx_deals_business_type ON public.deals(business_type);

-- Composite index for lead scoring queries
CREATE INDEX IF NOT EXISTS idx_deals_scoring ON public.deals(
  interest_level,
  business_type,
  monthly_revenue,
  number_of_employees
);

-- Index for created_at to speed up time-based queries
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON public.deals(created_at DESC);

-- Index for updated_at for real-time updates
CREATE INDEX IF NOT EXISTS idx_deals_updated_at ON public.deals(updated_at DESC);

-- Partial index for hot leads (interest_level >= 4)
CREATE INDEX IF NOT EXISTS idx_deals_hot_leads ON public.deals(interest_level, created_at DESC)
WHERE interest_level >= 4;

-- Partial index for signed up deals
CREATE INDEX IF NOT EXISTS idx_deals_signed_up_true ON public.deals(created_at DESC)
WHERE signed_up = true;

-- Create indexes for organizations table
CREATE INDEX IF NOT EXISTS idx_organizations_name ON public.organizations(name);
CREATE INDEX IF NOT EXISTS idx_organizations_industry ON public.organizations(industry);
CREATE INDEX IF NOT EXISTS idx_organizations_created_at ON public.organizations(created_at DESC);

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

-- Create indexes for team_members table
CREATE INDEX IF NOT EXISTS idx_team_members_email ON public.team_members(email);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);
CREATE INDEX IF NOT EXISTS idx_team_members_active ON public.team_members(is_active);

-- Create indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- Composite index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, created_at DESC)
WHERE is_read = false;

-- Analyze tables to update statistics
ANALYZE public.deals;
ANALYZE public.organizations;
ANALYZE public.activities;
ANALYZE public.team_members;
ANALYZE public.notifications;

-- Create a materialized view for rep performance stats (refresh periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS rep_performance_stats AS
SELECT 
  username,
  COUNT(*) as total_submissions,
  COUNT(*) FILTER (WHERE signed_up = true) as signed_up_count,
  AVG(interest_level) as avg_interest_level,
  COUNT(*) FILTER (WHERE interest_level >= 4) as hot_leads_count,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as weekly_submissions,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as monthly_submissions,
  MAX(created_at) as last_submission_date
FROM public.deals
WHERE username IS NOT NULL
GROUP BY username;

-- Create index on the materialized view
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