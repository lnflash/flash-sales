-- Diagnose RLS Access Issues
-- Run this as a superuser to check what data users can see

-- 1. Check current user and their role
SELECT 
    current_user,
    auth.uid() as auth_user_id,
    u.email,
    u.username,
    u.role
FROM users u
WHERE u.id = auth.uid();

-- 2. Check if user can see deals
SELECT 
    'Deals visible to current user' as check_type,
    COUNT(*) as count
FROM deals
WHERE true; -- RLS will filter this

-- 3. Check if user can see their own deals
SELECT 
    'Deals owned by current user' as check_type,
    COUNT(*) as count
FROM deals
WHERE owner_id = auth.uid();

-- 4. Check if user can see unassigned deals
SELECT 
    'Unassigned deals' as check_type,
    COUNT(*) as count
FROM deals
WHERE owner_id IS NULL;

-- 5. Check organizations visibility
SELECT 
    'Organizations visible' as check_type,
    COUNT(*) as count
FROM organizations;

-- 6. Check contacts visibility
SELECT 
    'Contacts visible' as check_type,
    COUNT(*) as count
FROM contacts;

-- 7. Check users visibility
SELECT 
    'Users visible' as check_type,
    COUNT(*) as count
FROM users;

-- 8. Test what happens when we bypass RLS (only works for superuser)
-- This shows total counts without RLS
SELECT 
    tablename,
    (SELECT COUNT(*) FROM deals) as deals_total,
    (SELECT COUNT(*) FROM organizations) as orgs_total,
    (SELECT COUNT(*) FROM contacts) as contacts_total,
    (SELECT COUNT(*) FROM users) as users_total
FROM pg_tables
WHERE tablename = 'deals'
LIMIT 1;

-- 9. Check specific policies on key tables
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual as using_expression
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('deals', 'organizations', 'contacts', 'users')
ORDER BY tablename, policyname;