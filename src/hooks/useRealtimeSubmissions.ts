import { useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { useAppStore } from '@/stores/useAppStore';

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
      .subscribe();

    // Log subscription status
    channel.on('error', (error) => {
      console.error('Realtime subscription error:', error);
      addNotification({
        type: 'error',
        title: 'Real-time Connection Error',
        message: 'Unable to establish real-time connection. Please refresh the page.',
      });
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
        (payload) => {
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
        (payload) => {
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