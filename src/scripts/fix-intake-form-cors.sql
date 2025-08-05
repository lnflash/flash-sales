-- Fix CORS issues for dynamic intake form by creating RPC functions

-- 1. Create RPC function to update deals (bypasses CORS issues)
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

-- 2. Create RPC function to update organizations
CREATE OR REPLACE FUNCTION update_organization_safe(
  org_id_param UUID,
  name_param TEXT,
  state_province_param TEXT,
  country_param TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE organizations
  SET 
    name = COALESCE(name_param, name),
    state_province = COALESCE(state_province_param, state_province),
    country = COALESCE(country_param, country),
    updated_at = NOW()
  WHERE id = org_id_param;
END;
$$;

-- 3. Create RPC function to update contacts
CREATE OR REPLACE FUNCTION update_contact_safe(
  contact_id_param UUID,
  phone_primary_param TEXT,
  email_param TEXT,
  first_name_param TEXT,
  last_name_param TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE contacts
  SET 
    phone_primary = COALESCE(phone_primary_param, phone_primary),
    email = COALESCE(email_param, email),
    first_name = COALESCE(first_name_param, first_name),
    last_name = COALESCE(last_name_param, last_name),
    updated_at = NOW()
  WHERE id = contact_id_param;
END;
$$;

-- 4. Create RPC function for soft deleting deals
CREATE OR REPLACE FUNCTION soft_delete_deal(
  deal_id_param UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE deals
  SET deleted_at = NOW()
  WHERE id = deal_id_param;
END;
$$;

-- Grant execute permissions to both authenticated and anon roles
GRANT EXECUTE ON FUNCTION update_deal TO authenticated;
GRANT EXECUTE ON FUNCTION update_deal TO anon;
GRANT EXECUTE ON FUNCTION update_organization_safe TO authenticated;
GRANT EXECUTE ON FUNCTION update_organization_safe TO anon;
GRANT EXECUTE ON FUNCTION update_contact_safe TO authenticated;
GRANT EXECUTE ON FUNCTION update_contact_safe TO anon;
GRANT EXECUTE ON FUNCTION soft_delete_deal TO authenticated;
GRANT EXECUTE ON FUNCTION soft_delete_deal TO anon;