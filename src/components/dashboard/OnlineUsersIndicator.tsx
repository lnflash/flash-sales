"use client";

import { UserCircleIcon } from "@heroicons/react/24/solid";

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
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <UserCircleIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {onlineUsers.length} {onlineUsers.length === 1 ? "user" : "users"} online
          </span>
        </div>

        <div className="flex -space-x-2">
          {onlineUsers.slice(0, 5).map((user) => (
            <div
              key={user.user_id}
              className="h-8 w-8 rounded-full bg-flash-green flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-900 hover:z-10 transition-all hover:scale-110"
              title={`${user.username}${user.current_page ? ` - ${user.current_page}` : ""}`}
            >
              {user.username.charAt(0).toUpperCase()}
            </div>
          ))}
          {onlineUsers.length > 5 && (
            <div className="h-8 w-8 rounded-full bg-gray-400 flex items-center justify-center text-white text-xs font-medium border-2 border-white dark:border-gray-900">
              +{onlineUsers.length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Detailed view on hover */}
      <details className="mt-2">
        <summary className="text-xs text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-900 dark:hover:text-white">View all online users</summary>
        <div className="mt-2 space-y-1">
          {onlineUsers.map((user) => (
            <div key={user.user_id} className="flex items-center justify-between text-xs">
              <span className="text-gray-900 dark:text-white">{user.username}</span>
              <span className="text-gray-500 dark:text-gray-400">{user.current_page || "Unknown page"}</span>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}
