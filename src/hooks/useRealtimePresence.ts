import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/useAuthStore';

interface PresenceState {
  user_id: string;
  username: string;
  current_page?: string;
  viewing_submission?: string;
  last_seen: string;
}

interface UsePresenceOptions {
  currentPage?: string;
  viewingSubmission?: string;
}

export function useRealtimePresence(options?: UsePresenceOptions) {
  const user = useAuthStore((state) => state.user);
  const [onlineUsers, setOnlineUsers] = useState<PresenceState[]>([]);
  const [viewingUsers, setViewingUsers] = useState<PresenceState[]>([]);

  // Track who's viewing the same submission
  useEffect(() => {
    if (!user || !options?.viewingSubmission) return;

    const channel = supabase.channel(`submission:${options.viewingSubmission}:presence`);

    // Track presence
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat() as PresenceState[];
        setViewingUsers(users.filter(u => u.user_id !== user.id));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            username: user.username,
            viewing_submission: options.viewingSubmission,
            last_seen: new Date().toISOString(),
          });
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user, options?.viewingSubmission]);

  // Track global online presence
  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('global:presence');

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const users = Object.values(state).flat() as PresenceState[];
        setOnlineUsers(users.filter(u => u.user_id !== user.id));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user_id: user.id,
            username: user.username,
            current_page: options?.currentPage || 'unknown',
            last_seen: new Date().toISOString(),
          });
        }
      });

    // Update presence when page changes
    if (options?.currentPage) {
      channel.track({
        user_id: user.id,
        username: user.username,
        current_page: options.currentPage,
        last_seen: new Date().toISOString(),
      });
    }

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user, options?.currentPage]);

  return {
    onlineUsers,
    viewingUsers,
    isUserOnline: (userId: string) => 
      onlineUsers.some(u => u.user_id === userId),
    getUsersOnPage: (page: string) => 
      onlineUsers.filter(u => u.current_page === page),
  };
}

// Component to show who's viewing the same item
export function PresenceAvatars({ submissionId }: { submissionId?: string }) {
  const { viewingUsers } = useRealtimePresence({ viewingSubmission: submissionId });

  if (viewingUsers.length === 0) return null;

  return (
    <div className="flex items-center space-x-1">
      <span className="text-xs text-light-text-secondary mr-2">
        Also viewing:
      </span>
      <div className="flex -space-x-2">
        {viewingUsers.slice(0, 3).map((user) => (
          <div
            key={user.user_id}
            className="h-6 w-6 rounded-full bg-flash-green flex items-center justify-center text-white text-xs font-medium border-2 border-white"
            title={user.username}
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
        ))}
        {viewingUsers.length > 3 && (
          <div className="h-6 w-6 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
            +{viewingUsers.length - 3}
          </div>
        )}
      </div>
    </div>
  );
}

// Hook to broadcast and listen to custom events
export function useRealtimeBroadcast(channel: string) {
  const [messages, setMessages] = useState<any[]>([]);

  const broadcast = useCallback((event: string, payload: any) => {
    const channelInstance = supabase.channel(channel);
    channelInstance.send({
      type: 'broadcast',
      event,
      payload,
    });
  }, [channel]);

  useEffect(() => {
    const channelInstance = supabase
      .channel(channel)
      .on('broadcast', { event: '*' }, (payload) => {
        setMessages((prev) => [...prev, payload]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelInstance);
    };
  }, [channel]);

  return { messages, broadcast };
}