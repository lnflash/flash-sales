import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { useSalesStore } from '@/stores/useSalesStore';

interface RealtimeOptions {
  enableDeals?: boolean;
  enableOrganizations?: boolean;
  enableActivities?: boolean;
  enableNotifications?: boolean;
}

export function useRealtimeSubscriptions(options: RealtimeOptions = {
  enableDeals: true,
  enableOrganizations: true,
  enableActivities: true,
  enableNotifications: true,
}) {
  const queryClient = useQueryClient();
  const addNotification = useAppStore((state) => state.addNotification);
  const fetchDeals = useSalesStore((state) => state.fetchDeals);

  useEffect(() => {
    const channels: any[] = [];

    // Subscribe to deals changes
    if (options.enableDeals) {
      const dealsChannel = supabase
        .channel('deals-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'deals'
          },
          (payload) => {
            console.log('Deal change:', payload);
            
            // Invalidate queries
            queryClient.invalidateQueries({ queryKey: ['supabase-submissions'] });
            queryClient.invalidateQueries({ queryKey: ['supabase-submission-stats'] });
            
            // Update Zustand store
            fetchDeals();
            
            // Show notification for new deals
            if (payload.eventType === 'INSERT' && options.enableNotifications) {
              addNotification({
                type: 'info',
                title: 'New Deal Created',
                message: `A new deal has been added to the pipeline`,
              });
            }
            
            // Optimistic updates for existing deals
            if (payload.eventType === 'UPDATE') {
              queryClient.setQueryData(['deal', payload.new.id], payload.new);
            }
          }
        )
        .subscribe();
      
      channels.push(dealsChannel);
    }

    // Subscribe to organizations changes
    if (options.enableOrganizations) {
      const orgsChannel = supabase
        .channel('organizations-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'organizations'
          },
          (payload) => {
            console.log('Organization change:', payload);
            queryClient.invalidateQueries({ queryKey: ['supabase-submissions'] });
            queryClient.invalidateQueries({ queryKey: ['organizations'] });
          }
        )
        .subscribe();
      
      channels.push(orgsChannel);
    }

    // Subscribe to activities changes
    if (options.enableActivities) {
      const activitiesChannel = supabase
        .channel('activities-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'activities'
          },
          (payload) => {
            console.log('Activity change:', payload);
            queryClient.invalidateQueries({ queryKey: ['activities'] });
            
            // Show notification for high-priority activities
            if (payload.eventType === 'INSERT' && 
                payload.new.priority === 'urgent' && 
                options.enableNotifications) {
              addNotification({
                type: 'warning',
                title: 'Urgent Activity Created',
                message: payload.new.subject,
              });
            }
          }
        )
        .subscribe();
      
      channels.push(activitiesChannel);
    }

    // Cleanup function
    return () => {
      channels.forEach(channel => {
        supabase.removeChannel(channel);
      });
    };
  }, [queryClient, addNotification, fetchDeals, options]);
}

// Keep the original hook for backward compatibility
export function useRealtimeDeals() {
  useRealtimeSubscriptions({ 
    enableDeals: true, 
    enableOrganizations: true,
    enableActivities: false,
    enableNotifications: false 
  });
}