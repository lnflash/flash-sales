# RLS Troubleshooting Guide

## Problem: Sales Reps Can't See Any Data

This is a common issue after enabling RLS. Here's how to diagnose and fix it.

## Quick Fix Options

### Option 1: Fix Data Visibility (RECOMMENDED)
Run this script to ensure proper data visibility:
```sql
-- Run: src/scripts/fix-rls-data-visibility.sql
```

This script:
- Ensures all authenticated users can see deals, organizations, contacts, and users
- Maintains security for insert/update/delete operations
- Includes a debug function to test specific users

### Option 2: Diagnose the Issue
First, understand what's happening:
```sql
-- Run: src/scripts/diagnose-rls-access.sql
```

This will show:
- Current user info
- What data they can see
- Policy details

### Option 3: Temporary Fix (Development Only)
If you need to temporarily bypass RLS:
```sql
-- Run: src/scripts/temporary-disable-rls.sql
```

This creates permissive policies that allow all authenticated users to access everything.

## Common Issues and Solutions

### 1. Auth User Mismatch
**Problem**: The user exists in the `users` table but not in `auth.users`, or IDs don't match.

**Check**:
```sql
SELECT * FROM debug_user_access('username_here');
```

**Solution**: Ensure users are created through proper auth flow, not just inserted into users table.

### 2. Wrong User Role
**Problem**: Policies check for specific roles that users don't have.

**Check**:
```sql
SELECT username, email, role FROM users;
```

**Solution**: Update user roles or adjust policies.

### 3. Service Role vs Anon Key
**Problem**: Using anon key in client but policies only allow authenticated users.

**Solution**: 
- Ensure you're using authenticated client after login
- Or add policies for the `anon` role

### 4. Policies Too Restrictive
**Problem**: Policies require ownership but deals are unassigned.

**Solution**: The fix-rls-data-visibility.sql script addresses this.

## Testing User Access

To test what a specific user can see:

```sql
-- Run as superuser
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'user-id-here';

-- Now test queries
SELECT COUNT(*) FROM deals;
SELECT COUNT(*) FROM organizations;

-- Reset
RESET ROLE;
```

## Best Practices

1. **Start Permissive**: Begin with permissive SELECT policies, then tighten as needed
2. **Test Thoroughly**: Test with actual user accounts, not just as superuser
3. **Monitor Logs**: Check Supabase logs for RLS policy violations
4. **Use Debug Functions**: Create helper functions to diagnose access issues

## Emergency Rollback

If all else fails and you need to disable RLS completely:

```sql
-- WARNING: This removes all security!
ALTER TABLE deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
-- etc for other tables
```

Then re-enable and fix policies when ready.