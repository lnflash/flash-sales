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
    <header className="bg-white border-b border-light-border">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-light-text-primary">{title}</h1>
            <p className="text-sm text-light-text-secondary mt-1">{currentDate}</p>
          </div>

          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <input
                type="text"
                placeholder="Search submissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-10 pr-4 py-2 bg-light-bg-secondary border border-light-border rounded-lg text-light-text-primary placeholder-light-text-tertiary focus:outline-none focus:ring-2 focus:ring-flash-green focus:border-transparent transition-all min-w-[280px]"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-light-text-tertiary absolute left-3 top-1/2 transform -translate-y-1/2" />
            </form>

            <button className="relative p-2 rounded-lg hover:bg-light-bg-secondary transition-colors">
              <BellIcon className="h-6 w-6 text-light-text-secondary" />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-flash-green rounded-full flex items-center justify-center text-xs text-white font-medium">
                  {notifications}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}