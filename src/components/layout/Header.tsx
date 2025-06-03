'use client';

import { useState } from 'react';
import { useRouter } from 'next/router';
import { BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { formatDate } from '@/utils/date-formatter';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [notifications] = useState(3);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const currentDate = formatDate(new Date().toISOString());

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      // Navigate to submissions page with search parameter
      router.push(`/dashboard/submissions?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e as any);
    }
  };

  return (
    <header className="bg-flash-dark-2 border-b border-flash-dark-3 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{title}</h1>
          <p className="text-sm text-gray-400">{currentDate}</p>
        </div>

        <div className="flex items-center space-x-4">
          <form onSubmit={handleSearch} className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search submissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 pr-4 py-2 bg-flash-dark-3 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-flash-green"
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          </form>

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