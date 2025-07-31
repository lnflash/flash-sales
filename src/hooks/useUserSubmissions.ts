'use client';

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Submission } from '@/types/submission';
import { mapDealToSubmission } from '@/lib/supabase-api';

export function useUserSubmissions(username: string | undefined) {
  console.log(`[useUserSubmissions] Hook called with username: ${username}`);
  
  return useQuery({
    queryKey: ['userSubmissions', username],
    queryFn: async () => {
      try {
        console.log(`[useUserSubmissions] Query function called for username: ${username}`);
        
        if (!username) {
          console.log(`[useUserSubmissions] No username provided, returning empty`);
          return { submissions: [], count: 0 };
        }

      console.log(`[useUserSubmissions] Fetching submissions for username: ${username}`);

      // First get the user ID
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .single();

      if (userError || !userData) {
        console.log(`[useUserSubmissions] No user found for username: ${username}`, { userError, userData });
        return { submissions: [], count: 0 };
      }

      console.log(`[useUserSubmissions] Found user ID: ${userData.id} for username: ${username}`);

      // Then get their deals
      const { data: deals, error: dealsError, count } = await supabase
        .from('deals')
        .select(`
          *,
          organization:organizations!organization_id(name, state_province),
          primary_contact:contacts!primary_contact_id(phone_primary),
          owner:users!owner_id(email, username)
        `, { count: 'exact' })
        .eq('owner_id', userData.id)
        .order('created_at', { ascending: false });

      if (dealsError) {
        console.error('Error fetching user deals:', dealsError);
        return { submissions: [], count: 0 };
      }

      console.log(`[useUserSubmissions] Found ${count} deals for user ${username}`);

      // Map deals to submissions
      const submissions: Submission[] = deals?.map(mapDealToSubmission) || [];
      
      console.log(`[useUserSubmissions] Mapped ${submissions.length} submissions for ${username}`);
      console.log(`[useUserSubmissions] First submission:`, submissions[0]);
      
      return { submissions, count: count || 0 };
      } catch (error) {
        console.error('[useUserSubmissions] Error in query function:', error);
        return { submissions: [], count: 0 };
      }
    },
    enabled: !!username,
    staleTime: 1000 * 60, // 1 minute
    retry: 1
  });
}