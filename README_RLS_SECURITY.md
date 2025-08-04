# Row Level Security (RLS) Implementation Guide

## Overview
Row Level Security (RLS) is crucial for protecting your data in Supabase. This guide helps you secure all tables that currently have RLS disabled.

## Current Status
The following tables need RLS enabled:
- `organizations`
- `contacts`
- `workflow_runs`
- `reports`
- `users`
- `activities`
- `deals`
- `teams`
- `pipelines`
- `lead_scores`
- `email_templates`
- `workflows`
- `audit_logs`
- `conversation_intelligence`
- `migration_status`

## Implementation Steps

### 1. Apply RLS Security Script
Run the following SQL script in your Supabase SQL editor:
```sql
-- Location: src/scripts/enable-rls-security.sql
```

This script will:
- Enable RLS on all unprotected tables
- Create appropriate security policies based on user roles
- Grant necessary permissions

### 2. Verify RLS Status
After applying the security script, verify the implementation:
```sql
-- Location: src/scripts/verify-rls-status.sql
```

This will show you:
- Which tables have RLS enabled
- Policy counts for each table
- Overall security status

## Security Policies Overview

### User Roles
The system recognizes three roles:
- `admin` - Full access to all data
- `sales_manager` - Elevated access to team data
- `sales_rep` - Access to own data and shared resources

### Key Policy Rules

#### Organizations & Contacts
- All users can view (needed for deal assignments)
- Only admins/managers can create/update
- Only admins can delete

#### Deals
- All users can view (needed for lead routing)
- Users can update their own deals or unassigned deals
- Admins/managers can update any deal
- Only admins can delete

#### Users
- All users can view all users (team collaboration)
- Users can only update their own profile
- Only admins can create new users

#### Activities
- All users can view (transparency)
- Users can only manage their own activities

#### Reports
- Users can view their own reports or public reports
- Users can create/update/delete their own reports
- Admins/managers can view all reports

#### Sensitive Data (Audit Logs, Migration Status)
- Only admins have access

## Testing RLS

After implementation, test the policies:

1. **As a regular user (sales_rep)**:
   - ✅ Should see all deals
   - ✅ Should update own deals
   - ❌ Should NOT delete any deals
   - ❌ Should NOT see audit logs

2. **As a sales_manager**:
   - ✅ Should update any deal
   - ✅ Should create organizations
   - ❌ Should NOT delete deals

3. **As an admin**:
   - ✅ Full access to all operations

## Troubleshooting

### If policies are too restrictive:
1. Check the user's role in the `users` table
2. Verify auth.uid() matches the user's ID
3. Review the specific policy using the verify script

### If data isn't visible:
1. Ensure RLS is enabled: `ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;`
2. Check if appropriate SELECT policies exist
3. Verify the user is authenticated

### Common Issues:
- **"new row violates row-level security policy"** - User doesn't have INSERT permission
- **Empty results when data exists** - Missing or incorrect SELECT policy
- **Can't update own data** - UPDATE policy might be checking wrong field

## Best Practices

1. **Always enable RLS** on new tables
2. **Start restrictive** and loosen policies as needed
3. **Test policies** with different user roles
4. **Use database functions** for complex authorization logic
5. **Audit regularly** using the verify script

## Emergency Rollback

If you need to temporarily disable RLS (NOT recommended for production):
```sql
-- Disable RLS on a specific table
ALTER TABLE tablename DISABLE ROW LEVEL SECURITY;

-- Drop all policies on a table
DROP POLICY IF EXISTS policy_name ON tablename;
```

## Security Considerations

1. **Service Role Key**: Never expose the service role key in client-side code
2. **Anon Key**: Safe for client-side, but still implements RLS
3. **Direct Database Access**: Only use for admin tools, not user-facing features
4. **Policy Bypass**: Service role bypasses RLS - use carefully

Remember: RLS is your last line of defense. Always implement security at multiple levels!