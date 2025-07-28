import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

export function useRealtimeDeals() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Subscribe to changes in deals table
    const channel = supabase
      .channel('deals-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals'
        },
        (payload) => {
          console.log('Deal change received:', payload);
          
          // Invalidate relevant queries to refetch data
          queryClient.invalidateQueries({ queryKey: ['supabase-submissions'] });
          queryClient.invalidateQueries({ queryKey: ['supabase-submission-stats'] });
          
          // You can also update the cache directly for optimistic updates
          if (payload.eventType === 'UPDATE') {
            queryClient.setQueryData(['deal', payload.new.id], payload.new);
          }
        }
      )
      .subscribe();

    // Subscribe to organization changes too
    const orgChannel = supabase
      .channel('organizations-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organizations'
        },
        (payload) => {
          console.log('Organization change received:', payload);
          queryClient.invalidateQueries({ queryKey: ['supabase-submissions'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(orgChannel);
    };
  }, [queryClient]);
}