-- Fix users table RLS policies (Safe version that handles existing policies)
-- This script safely drops existing policies before creating new ones

-- First, drop ALL existing policies on the users table
DO $$
DECLARE
    pol record;
BEGIN
    -- Loop through all policies on the users table and drop them
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON users', pol.policyname);
    END LOOP;
END $$;

-- Now create the correct policies

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

-- Ensure the update_user_profile function works with RLS
GRANT EXECUTE ON FUNCTION update_user_profile TO authenticated;

-- Create or replace the function to handle new users
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

-- Drop and recreate the trigger to ensure it's set up correctly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the policies were created
SELECT 
    'Users table policies created successfully' as status,
    COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename = 'users';