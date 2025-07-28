-- Flash CRM Complete Database Schema
-- This file documents the complete schema as implemented in Supabase
-- Generated after successful migration of 763 records

-- =====================================================
-- EXTENSIONS
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Teams table
CREATE TABLE public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parent_team_id UUID REFERENCES public.teams(id),
  manager_id UUID,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organizations table (merchants/companies)
CREATE TABLE public.organizations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  legal_name TEXT,
  type TEXT CHECK (type IN ('merchant', 'partner', 'vendor', 'other')),
  industry TEXT,
  website TEXT,
  logo_url TEXT,
  employee_count_range TEXT,
  annual_revenue_range TEXT,
  tax_id TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  state_province TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'US',
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  source TEXT,
  source_details JSONB,
  status TEXT DEFAULT 'prospect' CHECK (status IN ('prospect', 'lead', 'customer', 'churned', 'blocked')),
  lifecycle_stage TEXT DEFAULT 'subscriber' CHECK (lifecycle_stage IN ('subscriber', 'lead', 'mql', 'sql', 'opportunity', 'customer', 'evangelist')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(legal_name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(industry, '')), 'C')
  ) STORED
);

-- Users table (sales reps)
CREATE TABLE public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  auth_id UUID UNIQUE,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'sales_rep' CHECK (role IN ('admin', 'manager', 'sales_rep', 'viewer')),
  permissions JSONB DEFAULT '{}',
  team_id UUID REFERENCES public.teams(id),
  reports_to_id UUID REFERENCES public.users(id),
  timezone TEXT DEFAULT 'America/New_York',
  notification_preferences JSONB DEFAULT '{}',
  dashboard_preferences JSONB DEFAULT '{}',
  quota_settings JSONB DEFAULT '{}',
  commission_rate DECIMAL(5,4) DEFAULT 0.05,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Add foreign key to teams
ALTER TABLE public.teams ADD CONSTRAINT fk_teams_manager FOREIGN KEY (manager_id) REFERENCES public.users(id);

-- Contacts table
CREATE TABLE public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  title TEXT,
  department TEXT,
  email TEXT UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  phone_primary TEXT,
  phone_mobile TEXT,
  phone_work TEXT,
  is_primary_contact BOOLEAN DEFAULT FALSE,
  is_decision_maker BOOLEAN DEFAULT FALSE,
  decision_maker_role TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  preferred_language TEXT DEFAULT 'en',
  communication_preferences JSONB DEFAULT '{"email": true, "sms": false, "phone": true}',
  linkedin_url TEXT,
  twitter_handle TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'bounced', 'unsubscribed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  last_contacted_at TIMESTAMPTZ,
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(first_name, '') || ' ' || coalesce(last_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(email, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(title, '')), 'C')
  ) STORED
);

-- Pipelines table
CREATE TABLE public.pipelines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  stages JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deals table (main sales opportunities)
CREATE TABLE public.deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  primary_contact_id UUID REFERENCES public.contacts(id),
  owner_id UUID REFERENCES public.users(id),
  created_by_id UUID REFERENCES public.users(id),
  name TEXT NOT NULL,
  description TEXT,
  stage TEXT NOT NULL DEFAULT 'qualification',
  stage_changed_at TIMESTAMPTZ DEFAULT NOW(),
  pipeline_id UUID REFERENCES public.pipelines(id),
  amount DECIMAL(12,2),
  currency TEXT DEFAULT 'USD',
  probability INTEGER DEFAULT 20 CHECK (probability >= 0 AND probability <= 100),
  expected_revenue DECIMAL(12,2) GENERATED ALWAYS AS (amount * probability / 100) STORED,
  close_date DATE,
  lost_reason TEXT,
  lost_reason_details TEXT,
  interest_level INTEGER CHECK (interest_level >= 1 AND interest_level <= 10),
  package_seen BOOLEAN DEFAULT FALSE,
  specific_needs TEXT,
  decision_makers TEXT,
  source TEXT,
  campaign_id UUID,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  competitors JSONB DEFAULT '[]',
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

-- Activities table
CREATE TABLE public.activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES public.deals(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id),
  owner_id UUID REFERENCES public.users(id),
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'demo', 'task', 'note', 'sms', 'linkedin', 'other')),
  subject TEXT NOT NULL,
  description TEXT,
  direction TEXT CHECK (direction IN ('inbound', 'outbound')),
  channel TEXT,
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled', 'no_show')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  outcome TEXT,
  next_steps TEXT,
  email_message_id TEXT,
  email_thread_id TEXT,
  email_opened BOOLEAN,
  email_clicked BOOLEAN,
  metadata JSONB DEFAULT '{}',
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- =====================================================
-- ANALYTICS & REPORTING TABLES
-- =====================================================

-- Lead Scores table
CREATE TABLE public.lead_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  total_score INTEGER NOT NULL,
  demographic_score INTEGER,
  firmographic_score INTEGER,
  behavioral_score INTEGER,
  score_components JSONB NOT NULL,
  model_version TEXT NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs table
CREATE TABLE public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  user_id UUID REFERENCES public.users(id),
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- WORKFLOW & AUTOMATION TABLES
-- =====================================================

-- Email Templates table
CREATE TABLE public.email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  use_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_by_id UUID REFERENCES public.users(id),
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflows table
CREATE TABLE public.workflows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB NOT NULL,
  actions JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_by_id UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Runs table
CREATE TABLE public.workflow_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id UUID REFERENCES public.workflows(id),
  deal_id UUID REFERENCES public.deals(id),
  organization_id UUID REFERENCES public.organizations(id),
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  steps_completed INTEGER DEFAULT 0,
  error_message TEXT,
  execution_log JSONB DEFAULT '[]'
);

-- Reports Configuration table
CREATE TABLE public.reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  config JSONB NOT NULL,
  schedule_config JSONB,
  created_by_id UUID REFERENCES public.users(id),
  is_shared BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migration Status table
CREATE TABLE public.migration_status (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  migration_name TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'failed', 'completed_with_errors')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  records_processed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation Intelligence table
CREATE TABLE public.conversation_intelligence (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id UUID REFERENCES public.activities(id) ON DELETE CASCADE,
  transcript TEXT,
  sentiment_score DECIMAL(3,2),
  key_topics TEXT[],
  action_items JSONB DEFAULT '[]',
  competitor_mentions JSONB DEFAULT '[]',
  objections JSONB DEFAULT '[]',
  talk_ratio DECIMAL(3,2),
  question_count INTEGER,
  monologue_duration_avg INTEGER,
  ai_summary TEXT,
  ai_recommendations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- VIEWS
-- =====================================================

-- Tasks view (filtered activities)
CREATE VIEW public.tasks AS
SELECT * FROM public.activities 
WHERE type = 'task' 
  AND deleted_at IS NULL;

-- Sales Performance Metrics (Materialized View)
CREATE MATERIALIZED VIEW public.sales_performance_metrics AS
SELECT 
  u.id as user_id,
  u.full_name,
  DATE_TRUNC('month', d.created_at) as month,
  COUNT(DISTINCT d.id) as deals_created,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'won') as deals_won,
  COUNT(DISTINCT d.id) FILTER (WHERE d.status = 'lost') as deals_lost,
  SUM(d.amount) FILTER (WHERE d.status = 'won') as revenue_closed,
  AVG(d.probability) as avg_probability,
  COUNT(DISTINCT a.id) as activities_count,
  COUNT(DISTINCT a.id) FILTER (WHERE a.type = 'call') as calls_made,
  COUNT(DISTINCT a.id) FILTER (WHERE a.type = 'email') as emails_sent,
  COUNT(DISTINCT a.id) FILTER (WHERE a.type = 'meeting') as meetings_held
FROM public.users u
LEFT JOIN public.deals d ON u.id = d.owner_id
LEFT JOIN public.activities a ON u.id = a.owner_id 
  AND a.created_at >= DATE_TRUNC('month', CURRENT_DATE)
WHERE u.deleted_at IS NULL
GROUP BY u.id, u.full_name, DATE_TRUNC('month', d.created_at);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_organizations_search ON public.organizations USING GIN(search_vector);
CREATE INDEX idx_organizations_status ON public.organizations(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_organizations_created ON public.organizations(created_at DESC);
CREATE INDEX idx_contacts_organization ON public.contacts(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_email ON public.contacts(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_search ON public.contacts USING GIN(search_vector);
CREATE INDEX idx_deals_organization ON public.deals(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_owner ON public.deals(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_stage ON public.deals(stage) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_status ON public.deals(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_close_date ON public.deals(close_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_deal ON public.activities(deal_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_organization ON public.activities(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_owner ON public.activities(owner_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_activities_scheduled ON public.activities(scheduled_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_lead_scores_org_time ON public.lead_scores(organization_id, calculated_at DESC);
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX idx_sales_performance_user_month ON public.sales_performance_metrics(user_id, month);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Apply update timestamp triggers to relevant tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_activities_updated_at BEFORE UPDATE ON public.activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_email_templates_updated_at BEFORE UPDATE ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_workflows_updated_at BEFORE UPDATE ON public.workflows FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_reports_updated_at BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =====================================================
-- REAL-TIME SUBSCRIPTIONS
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activities;
ALTER PUBLICATION supabase_realtime ADD TABLE public.organizations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Currently disabled for development
-- To enable: ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
-- Then add appropriate policies for your security model

-- =====================================================
-- DEFAULT DATA
-- =====================================================

INSERT INTO public.pipelines (name, is_default, stages) VALUES (
  'Default Sales Pipeline',
  TRUE,
  '[
    {"name": "Qualification", "order": 1, "probability": 20},
    {"name": "Discovery", "order": 2, "probability": 40},
    {"name": "Proposal", "order": 3, "probability": 60},
    {"name": "Negotiation", "order": 4, "probability": 80},
    {"name": "Closed Won", "order": 5, "probability": 100},
    {"name": "Closed Lost", "order": 6, "probability": 0}
  ]'::jsonb
);