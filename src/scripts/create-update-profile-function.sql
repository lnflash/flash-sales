-- Create a function to update user profile
-- This bypasses CORS issues by using RPC instead of direct PATCH

CREATE OR REPLACE FUNCTION update_user_profile(
  user_id UUID,
  first_name_param TEXT DEFAULT NULL,
  last_name_param TEXT DEFAULT NULL,
  timezone_param TEXT DEFAULT NULL,
  phone_param TEXT DEFAULT NULL,
  default_territory_param TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_user JSON;
  notification_prefs JSONB;
  dashboard_prefs JSONB;
BEGIN
  -- Get current preferences
  SELECT 
    COALESCE(notification_preferences, '{}'::jsonb),
    COALESCE(dashboard_preferences, '{}'::jsonb)
  INTO notification_prefs, dashboard_prefs
  FROM users
  WHERE id = user_id;

  -- Update phone in notification preferences if provided
  IF phone_param IS NOT NULL THEN
    notification_prefs = jsonb_set(notification_prefs, '{phone}', to_jsonb(phone_param));
  END IF;

  -- Update default territory in dashboard preferences if provided
  IF default_territory_param IS NOT NULL THEN
    dashboard_prefs = jsonb_set(dashboard_prefs, '{default_territory}', to_jsonb(default_territory_param));
  END IF;

  -- Update the user record
  UPDATE users
  SET
    first_name = COALESCE(first_name_param, first_name),
    last_name = COALESCE(last_name_param, last_name),
    timezone = COALESCE(timezone_param, timezone),
    notification_preferences = notification_prefs,
    dashboard_preferences = dashboard_prefs,
    updated_at = NOW()
  WHERE id = user_id
  RETURNING row_to_json(users.*) INTO updated_user;

  RETURN updated_user;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_profile TO authenticated;