'use client';

import { useState } from 'react';
import { BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/utils/date-formatter';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [notifications] = useState(3);
  const currentDate = formatDate(new Date().toISOString());

  return (
    <header className="bg-flash-dark-2 border-b border-flash-dark-3 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-sm text-gray-400">{currentDate}</p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 bg-flash-dark-3 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-flash-green"
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </div>

          <button className="relative p-2 rounded-full hover:bg-flash-dark-3 transition-colors">
            <BellIcon className="h-6 w-6 text-gray-300" />
            {notifications > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-flash-yellow rounded-full flex items-center justify-center text-xs text-flash-dark-1 font-semibold">
                {notifications}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}