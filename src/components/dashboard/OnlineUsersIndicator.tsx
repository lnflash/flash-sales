'use client';

import { UserCircleIcon } from '@heroicons/react/24/solid';

interface OnlineUsersIndicatorProps {
  onlineUsers: Array<{
    user_id: string;
    username: string;
    current_page?: string;
  }>;
}

export default function OnlineUsersIndicator({ onlineUsers }: OnlineUsersIndicatorProps) {
  if (onlineUsers.length === 0) return null;

  return (
    <div className="bg-white border border-light-border rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <UserCircleIcon className="h-5 w-5 text-light-text-secondary" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <span className="text-sm font-medium text-light-text-primary">
            {onlineUsers.length} {onlineUsers.length === 1 ? 'user' : 'users'} online
          </span>
        </div>
        
        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 5).map((user) => (
            <div
              key={user.user_id}
              className="h-8 w-8 rounded-full bg-flash-green flex items-center justify-center text-white text-xs font-medium border-2 border-white hover:z-10 transition-all hover:scale-110"
              title={`${user.username}${user.current_page ? ` - ${user.current_page}` : ''}`}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
          ))}
          {onlineUsers.length > 5 && (
            <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white">
              +{onlineUsers.length - 5}
            </div>
          )}
        </div>
      </div>
      
      {/* Detailed view on hover */}
      <details className="mt-2">
        <summary className="text-xs text-light-text-secondary cursor-pointer hover:text-light-text-primary">
          View all online users
        </summary>
        <div className="mt-2 space-y-1">
          {onlineUsers.map((user) => (
            <div key={user.user_id} className="flex items-center justify-between text-xs">
              <span className="text-light-text-primary">{user.username}</span>
              <span className="text-light-text-tertiary">{user.current_page || 'Unknown page'}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}