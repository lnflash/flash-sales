-- Fix users table RLS policies
-- This script fixes the user profile creation issue

-- First, drop the overly restrictive policy
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON users;

-- Create proper policies for the users table

-- 1. Users can view all users (needed for team collaboration)
CREATE POLICY "users_select_all" ON users
    FOR SELECT TO authenticated
    USING (true);

-- 2. Users can insert their own profile during registration
CREATE POLICY "users_insert_own" ON users
    FOR INSERT TO authenticated
    WITH CHECK (
        -- Allow users to create their own profile
        id = auth.uid()
        -- Or if no auth.uid() yet (during registration), allow based on email
        OR NOT EXISTS (SELECT 1 FROM users WHERE id = auth.uid())
    );

-- 3. Users can update their own profile
CREATE POLICY "users_update_own" ON users
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- 4. Admins can manage all users
CREATE POLICY "users_admin_all" ON users
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- Also ensure the update_user_profile function works with RLS
-- Grant execution permission if not already granted
GRANT EXECUTE ON FUNCTION update_user_profile TO authenticated;

-- Create a policy to allow the useSupabaseProfile hook to create users
-- This handles the case where a user logs in but doesn't have a profile yet
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert a new user profile when auth.users is created
  INSERT INTO public.users (id, email, username, role, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'role', 'sales_rep'),
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;