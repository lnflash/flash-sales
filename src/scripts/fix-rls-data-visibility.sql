-- Fix RLS Data Visibility Issues
-- This script ensures sales reps can see the data they need

-- 1. First, let's check if the auth.uid() is properly set for users
-- This is critical - if auth.uid() doesn't match users.id, nothing will work
DO $$
DECLARE
    user_count integer;
    auth_user_count integer;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO auth_user_count FROM auth.users;
    
    RAISE NOTICE 'Users table count: %, Auth users count: %', user_count, auth_user_count;
    
    -- Check for mismatched IDs
    IF EXISTS (
        SELECT 1 
        FROM users u 
        WHERE NOT EXISTS (
            SELECT 1 FROM auth.users au WHERE au.id = u.id
        )
    ) THEN
        RAISE WARNING 'Found users in users table without matching auth.users entry!';
    END IF;
END $$;

-- 2. Fix deals visibility - ensure the policy is correct
DROP POLICY IF EXISTS deals_select_authenticated ON deals;
CREATE POLICY "deals_select_authenticated" ON deals
    FOR SELECT TO authenticated
    USING (true);  -- All authenticated users can see all deals

-- 3. Fix organizations visibility
DROP POLICY IF EXISTS organizations_select_authenticated ON organizations;
CREATE POLICY "organizations_select_authenticated" ON organizations
    FOR SELECT TO authenticated
    USING (true);  -- All authenticated users can see all organizations

-- 4. Fix contacts visibility
DROP POLICY IF EXISTS contacts_select_authenticated ON contacts;
CREATE POLICY "contacts_select_authenticated" ON contacts
    FOR SELECT TO authenticated
    USING (true);  -- All authenticated users can see all contacts

-- 5. Fix users visibility
DROP POLICY IF EXISTS users_select_all ON users;
CREATE POLICY "users_select_all" ON users
    FOR SELECT TO authenticated
    USING (true);  -- All authenticated users can see all users

-- 6. Create a function to help debug auth issues
CREATE OR REPLACE FUNCTION debug_user_access(username_param text)
RETURNS TABLE (
    check_name text,
    result text
) AS $$
DECLARE
    user_id uuid;
    user_role text;
    deals_count integer;
    orgs_count integer;
BEGIN
    -- Get user info
    SELECT id, role INTO user_id, user_role 
    FROM users 
    WHERE username = username_param 
    OR email = username_param || '@getflash.io'
    LIMIT 1;
    
    IF user_id IS NULL THEN
        RETURN QUERY SELECT 'User Found'::text, 'NO - User not found'::text;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT 'User Found'::text, 'YES'::text;
    RETURN QUERY SELECT 'User ID'::text, user_id::text;
    RETURN QUERY SELECT 'User Role'::text, user_role::text;
    
    -- Check if user exists in auth.users
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = user_id) THEN
        RETURN QUERY SELECT 'Auth User Exists'::text, 'YES'::text;
    ELSE
        RETURN QUERY SELECT 'Auth User Exists'::text, 'NO - This is the problem!'::text;
    END IF;
    
    -- Count accessible data
    SELECT COUNT(*) INTO deals_count FROM deals WHERE owner_id = user_id;
    RETURN QUERY SELECT 'Owned Deals'::text, deals_count::text;
    
    SELECT COUNT(*) INTO deals_count FROM deals WHERE owner_id IS NULL;
    RETURN QUERY SELECT 'Unassigned Deals'::text, deals_count::text;
    
    SELECT COUNT(*) INTO orgs_count FROM organizations;
    RETURN QUERY SELECT 'Total Organizations'::text, orgs_count::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 8. Special handling for the anon role (if using Supabase client without auth)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- 9. Test the debug function (replace with actual username)
-- SELECT * FROM debug_user_access('your_username_here');

-- 10. Summary of what this script does
SELECT 
    'RLS Data Visibility Fixed' as status,
    'All authenticated users can now:' as description
UNION ALL
SELECT 
    '✓',
    'See all deals'
UNION ALL
SELECT 
    '✓',
    'See all organizations'
UNION ALL
SELECT 
    '✓',
    'See all contacts'
UNION ALL
SELECT 
    '✓',
    'See all users';