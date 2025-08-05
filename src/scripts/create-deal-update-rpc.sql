-- Create RPC function to update deals (bypasses CORS issues)
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
  metadata_param JSONB
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
    name = name_param,
    organization_id = organization_id_param,
    primary_contact_id = primary_contact_id_param,
    package_seen = package_seen_param,
    decision_makers = decision_makers_param,
    interest_level = interest_level_param,
    status = status_param,
    lead_status = lead_status_param,
    specific_needs = specific_needs_param,
    stage = stage_param,
    metadata = metadata_param,
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