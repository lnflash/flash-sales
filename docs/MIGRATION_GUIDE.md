# Supabase Migration Guide

## Migration Complete! 🎉

Your data has been successfully migrated to Supabase. Here's how to update your components:

## 1. Update Dashboard Components

Replace old API calls with Supabase queries:

### Before (using old API):
```typescript
import { useSubmissions } from '@/hooks/useSubmissions';

export default function Dashboard() {
  const { submissions, isLoading } = useSubmissions();
  // ...
}
```

### After (using Supabase):
```typescript
import { useSupabaseSubmissions } from '@/hooks/useSupabaseSubmissions';
import { useRealtimeDeals } from '@/hooks/useRealtimeDeals';

export default function Dashboard() {
  const { data: submissions, isLoading } = useSupabaseSubmissions();
  useRealtimeDeals(); // Enable real-time updates
  // ...
}
```

## 2. Update API Routes

Replace `/api/submissions` endpoints with direct Supabase queries:

### Before:
```typescript
// pages/api/submissions/[id].ts
export default async function handler(req, res) {
  const submission = await getSubmission(req.query.id);
  res.json(submission);
}
```

### After:
```typescript
// Use Supabase client directly in components
const { data: deal } = await supabase
  .from('deals')
  .select('*, organization:organizations(*)')
  .eq('id', dealId)
  .single();
```

## 3. Update Environment Variables

Your app now uses:
- `NEXT_PUBLIC_SUPABASE_URL` - For client-side connections
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - For client-side auth
- `SUPABASE_SERVICE_ROLE_KEY` - For server-side admin tasks

Remove old variables:
- `INTAKE_API_URL` - No longer needed after migration

## 4. New Features Available

With Supabase, you now have:

### Real-time Updates
```typescript
// Subscribe to live changes
supabase
  .channel('custom-channel')
  .on('postgres_changes', { 
    event: 'INSERT', 
    schema: 'public', 
    table: 'deals' 
  }, payload => {
    console.log('New deal created!', payload.new)
  })
  .subscribe()
```

### Advanced Filtering
```typescript
// Complex queries with filters
const { data } = await supabase
  .from('deals')
  .select('*')
  .gte('interest_level', 7)
  .eq('status', 'open')
  .order('created_at', { ascending: false })
  .limit(10);
```

### File Storage
```typescript
// Upload files to Supabase Storage
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar.png', file);
```

## 5. Update Your Components

Key files to update:
1. `/src/pages/dashboard/index.tsx` - Main dashboard
2. `/src/pages/dashboard/submissions/index.tsx` - Submissions list
3. `/src/hooks/useSubmissions.ts` - Replace with Supabase version
4. `/src/lib/api.ts` - Update to use Supabase client

## 6. Testing

1. Check that all data displays correctly
2. Test real-time updates by making changes in Supabase dashboard
3. Verify filtering and sorting work
4. Test creating new deals/organizations

## Next Steps

1. **Remove old API code** - Clean up `/pages/api` endpoints that are no longer needed
2. **Implement authentication** - Use Supabase Auth for user management
3. **Add RLS policies** - Secure your data with Row Level Security
4. **Set up backups** - Configure Supabase backups for data safety

## Troubleshooting

### Issue: Data not showing
- Check RLS policies are not blocking access
- Verify environment variables are correct
- Check browser console for errors

### Issue: Real-time not working
- Ensure you've enabled real-time on tables
- Check WebSocket connection in browser network tab
- Verify you're subscribed to the correct channel

### Issue: Permission denied
- For development, you may need to temporarily disable RLS
- Ensure you're using the correct API keys
- Check user roles and permissions

## Support

- Supabase Docs: https://supabase.com/docs
- Discord: https://discord.supabase.com
- Your migration stats: 763 records successfully migrated!