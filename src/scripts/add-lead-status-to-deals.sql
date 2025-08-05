-- Add lead_status column to deals table
ALTER TABLE deals 
ADD COLUMN IF NOT EXISTS lead_status TEXT;

-- Add check constraint for valid lead_status values
ALTER TABLE deals 
ADD CONSTRAINT deals_lead_status_check 
CHECK (lead_status IN ('new', 'contacted', 'qualified', 'converted', 'disqualified'));

-- Set default value for existing records
UPDATE deals 
SET lead_status = CASE
  WHEN status = 'won' THEN 'converted'
  WHEN status = 'lost' THEN 'disqualified'
  WHEN stage = 'initial_contact' THEN 'contacted'
  WHEN stage = 'qualification' THEN 'qualified'
  ELSE 'new'
END
WHERE lead_status IS NULL;

-- Add comment to describe the field
COMMENT ON COLUMN deals.lead_status IS 'The lead qualification status of the deal';

-- Update the update_deal RPC function to include lead_status
DROP FUNCTION IF EXISTS update_deal(UUID, TEXT, UUID, UUID, BOOLEAN, TEXT, INTEGER, TEXT, TEXT, TEXT, TEXT, JSONB);

CREATE OR REPLACE FUNCTION update_deal(
  deal_id_param UUID,
  name_param TEXT,
  organization_id_param UUID,
  primary_contact_id_param UUID,
  package_seen_param BOOLEAN,
  decision_makers_param TEXT,
  interest_level_param INTEGER,
  status_param TEXT,
  lead_status_param TEXT,
  specific_needs_param TEXT,
  stage_param TEXT,
  custom_fields_param JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_deal JSON;
BEGIN
  -- Update the deal
  UPDATE deals
  SET 
    name = COALESCE(name_param, name),
    organization_id = COALESCE(organization_id_param, organization_id),
    primary_contact_id = COALESCE(primary_contact_id_param, primary_contact_id),
    package_seen = COALESCE(package_seen_param, package_seen),
    decision_makers = COALESCE(decision_makers_param, decision_makers),
    interest_level = COALESCE(interest_level_param, interest_level),
    status = COALESCE(status_param, status),
    lead_status = COALESCE(lead_status_param, lead_status),
    specific_needs = COALESCE(specific_needs_param, specific_needs),
    stage = COALESCE(stage_param, stage),
    custom_fields = COALESCE(custom_fields_param, custom_fields),
    updated_at = NOW()
  WHERE id = deal_id_param
  RETURNING to_json(deals.*) INTO updated_deal;
  
  IF updated_deal IS NULL THEN
    RAISE EXCEPTION 'Deal not found';
  END IF;
  
  RETURN updated_deal;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_deal TO authenticated;
GRANT EXECUTE ON FUNCTION update_deal TO anon;