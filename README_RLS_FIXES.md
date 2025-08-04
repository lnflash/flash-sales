# RLS Fixes Applied

## Issues Fixed

### 1. Activities Table Column Error
**Error**: `column "user_id" does not exist`
**Fix**: Changed from `user_id` to `owner_id` in activities policies

### 2. User Profile Creation Error
**Error**: `Failed to create user profile`
**Fix**: 
- Updated users table RLS policies to allow profile creation
- Modified `useSupabaseProfile` hook to include auth user ID when creating profiles
- Created proper INSERT policy for users table

## SQL Scripts to Run

### Step 1: Fix Users Table RLS (REQUIRED)
Run this script to fix the user profile creation issue:
```sql
-- Location: src/scripts/fix-users-rls.sql
```

This script:
- Drops the overly restrictive policy
- Creates proper policies that allow users to create their own profiles
- Adds an auth trigger to auto-create profiles on signup

### Step 2: Apply Full RLS Security (OPTIONAL)
After fixing the users table, you can apply the full RLS security:
```sql
-- Location: src/scripts/enable-rls-security.sql
```

## Testing After Fixes

1. **Test User Profile Creation**:
   - Log out and log back in
   - Profile should be created automatically
   - No "Failed to create user profile" error

2. **Test Profile Updates**:
   - Go to profile page
   - Change default territory
   - Save should work without errors

3. **Test Activities**:
   - Create a new activity
   - Should work with the corrected `owner_id` field

## Important Notes

- The `fix-users-rls.sql` script MUST be run first
- It includes an auth trigger that auto-creates user profiles
- The RPC function for profile updates should still work with RLS enabled
- All authenticated users can view all users (needed for team features)