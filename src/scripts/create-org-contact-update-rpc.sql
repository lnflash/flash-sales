-- Create RPC function to update organizations
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

-- Create RPC function to update contacts
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION update_organization_safe TO authenticated;
GRANT EXECUTE ON FUNCTION update_organization_safe TO anon;
GRANT EXECUTE ON FUNCTION update_contact_safe TO authenticated;
GRANT EXECUTE ON FUNCTION update_contact_safe TO anon;