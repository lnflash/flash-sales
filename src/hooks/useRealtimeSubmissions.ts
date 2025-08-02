import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/useAppStore';
import { isFeatureEnabled } from '@/config/features';

interface RealtimeEvent {
  event: 'INSERT' | 'UPDATE' | 'DELETE';
  schema: string;
  table: string;
  new: any;
  old: any;
}

export function useRealtimeSubmissions() {
  const queryClient = useQueryClient();
  const addNotification = useAppStore((state) => state.addNotification);

  const handleRealtimeUpdate = useCallback((payload: RealtimeEvent) => {
    // Invalidate relevant queries
    queryClient.invalidateQueries({ queryKey: ['submissions'] });
    queryClient.invalidateQueries({ queryKey: ['userSubmissions'] });
    queryClient.invalidateQueries({ queryKey: ['submissionStats'] });

    // Show notification for important events
    if (payload.event === 'INSERT') {
      const submission = payload.new;
      addNotification({
        type: 'info',
        title: 'New Submission',
        message: `New lead from ${submission.name || 'Unknown'}`,
      });
    } else if (payload.event === 'UPDATE' && payload.new?.status !== payload.old?.status) {
      addNotification({
        type: 'success',
        title: 'Status Updated',
        message: `Lead status changed to ${payload.new.status}`,
      });
    }
  }, [queryClient, addNotification]);

  useEffect(() => {
    // Check if real-time is enabled
    if (!isFeatureEnabled('realtime.submissions')) {
      console.log('Real-time submissions feature is disabled');
      return;
    }

    // Check if Supabase is properly configured
    if (!process.env.NEXT_PUBLIC_USE_SUPABASE || process.env.NEXT_PUBLIC_USE_SUPABASE !== 'true') {
      console.log('Supabase real-time disabled - skipping subscription');
      return;
    }

    console.log('Setting up real-time subscription for submissions...');
    
    // Subscribe to deals table (submissions)
    const channel = supabase
      .channel('realtime:submissions')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'deals' 
        },
        handleRealtimeUpdate
      )
      .subscribe((status: any) => {
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to real-time submissions');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to real-time submissions');
        } else if (status === 'TIMED_OUT') {
          console.error('Real-time subscription timed out');
        } else {
          console.log('Real-time subscription status:', status);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [handleRealtimeUpdate, addNotification]);
}

// Hook for specific submission updates
export function useRealtimeSubmission(submissionId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!submissionId) return;

    const channel = supabase
      .channel(`submission:${submissionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals',
          filter: `id=eq.${submissionId}`,
        },
        (payload: any) => {
          // Update specific submission in cache
          queryClient.invalidateQueries({ 
            queryKey: ['submission', submissionId] 
          });
          
          // Update submission in list queries
          queryClient.setQueriesData(
            { queryKey: ['submissions'] },
            (oldData: any) => {
              if (!oldData) return oldData;
              
              return {
                ...oldData,
                submissions: oldData.submissions?.map((sub: any) =>
                  sub.id === submissionId ? payload.new : sub
                ),
              };
            }
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [submissionId, queryClient]);
}

// Hook for user-specific real-time updates
export function useRealtimeUserSubmissions(userId: string | undefined) {
  const queryClient = useQueryClient();
  const addNotification = useAppStore((state) => state.addNotification);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user:${userId}:submissions`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deals',
          filter: `owner_id=eq.${userId}`,
        },
        (payload: any) => {
          // Invalidate user-specific queries
          queryClient.invalidateQueries({ 
            queryKey: ['userSubmissions', userId] 
          });
          
          // Notify user of their submission updates
          if (payload.event === 'UPDATE') {
            addNotification({
              type: 'info',
              title: 'Your Lead Updated',
              message: `${payload.new.name} has been updated`,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, addNotification]);
}