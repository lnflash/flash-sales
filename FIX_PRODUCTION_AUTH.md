# Fix Production Authentication

## The Issue
The login form is trying to use GraphQL authentication, but the `NEXT_PUBLIC_GRAPHQL_URI` is not set in production, causing a 504 Gateway Timeout.

## Option 1: Quick Fix (Add GraphQL URI)

In DigitalOcean App Platform:
1. Go to Settings → Environment Variables
2. Add: `NEXT_PUBLIC_GRAPHQL_URI=https://api.flashapp.me/graphql` (or whatever your GraphQL endpoint is)
3. Redeploy

## Option 2: Proper Fix (Use Supabase Auth)

Since you've migrated to Supabase, the authentication should use Supabase instead of GraphQL.

### Update LoginForm.tsx to use Supabase:

```typescript
import { supabase } from '@/lib/supabase-client';

// In handleSubmit function:
const { data: { user }, error } = await supabase.auth.signInWithPassword({
  email: `${username}@flashapp.me`, // or however you map usernames to emails
  password: 'password' // or use a different auth method
});
```

### Or use Supabase's user table directly:

```typescript
// Check if username exists in users table
const { data: user, error } = await supabase
  .from('users')
  .select('id, email, full_name')
  .eq('username', trimmedUsername)
  .single();

if (user) {
  // Store user info and redirect
  saveUserToStorage({
    username: trimmedUsername,
    userId: user.id,
    loggedInAt: Date.now(),
  });
  router.push('/dashboard');
}
```

## Option 3: Disable GraphQL Proxy (if not needed)

If GraphQL is no longer needed, update the login to work without it:
1. Remove GraphQL dependencies from LoginForm
2. Use a simple username validation or Supabase auth
3. Update the authentication flow

## Current Status

The app is trying to authenticate users through a GraphQL endpoint that doesn't exist in production. Either:
1. Add the GraphQL endpoint URL to environment variables
2. Update the authentication to use Supabase
3. Implement a different authentication method

The error "Could not connect to the authentication service" happens because the GraphQL proxy returns a 503 error when `NEXT_PUBLIC_GRAPHQL_URI` is not set.