'use client';

import { useState } from 'react';
import { SubmissionFilters } from '@/types/submission';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

interface SubmissionFiltersProps {
  filters: SubmissionFilters;
  onFilterChange: (filters: SubmissionFilters) => void;
  onResetFilters: () => void;
}

export default function SubmissionFiltersComponent({
  filters,
  onFilterChange,
  onResetFilters,
}: SubmissionFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search || '');
  
  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onFilterChange({ ...filters, search: searchInput });
  };

  const handleInterestLevelChange = (level: number) => {
    const currentLevels = filters.interestLevel || [];
    
    if (currentLevels.includes(level)) {
      // Remove this level
      onFilterChange({
        ...filters,
        interestLevel: currentLevels.filter(l => l !== level)
      });
    } else {
      // Add this level
      onFilterChange({
        ...filters,
        interestLevel: [...currentLevels, level]
      });
    }
  };

  const handleSignedUpChange = (value: boolean | undefined) => {
    onFilterChange({
      ...filters,
      signedUp: filters.signedUp === value ? undefined : value
    });
  };

  const handlePackageSeenChange = (value: boolean | undefined) => {
    onFilterChange({
      ...filters,
      packageSeen: filters.packageSeen === value ? undefined : value
    });
  };

  const isFilterActive = (
    filters.search || 
    (filters.interestLevel && filters.interestLevel.length > 0) ||
    filters.signedUp !== undefined ||
    filters.packageSeen !== undefined ||
    filters.dateRange?.start ||
    filters.dateRange?.end ||
    filters.username
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm mb-4 border border-light-border dark:border-gray-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <form 
          onSubmit={handleSearchSubmit}
          className="relative flex-1 w-full"
        >
          <input
            type="text"
            placeholder="Search by name, phone, email, territory, rep..."
            title="Search across all submission fields"
            className="w-full pl-10 pr-4 py-2 bg-light-bg-secondary dark:bg-gray-700 rounded-md text-light-text-primary dark:text-white placeholder-light-text-tertiary dark:placeholder-gray-400 border border-light-border dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-flash-green focus:border-flash-green"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <MagnifyingGlassIcon className="h-5 w-5 text-light-text-tertiary dark:text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          {searchInput && (
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-light-text-tertiary dark:text-gray-400 hover:text-light-text-secondary dark:hover:text-gray-300"
              onClick={() => {
                setSearchInput('');
                if (filters.search) {
                  onFilterChange({ ...filters, search: undefined });
                }
              }}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            type="button"
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              isFilterActive
                ? 'bg-flash-green text-white'
                : 'bg-white dark:bg-gray-700 text-light-text-primary dark:text-gray-300 border border-light-border dark:border-gray-600 hover:bg-light-bg-secondary dark:hover:bg-gray-600'
            }`}
            onClick={() => setShowFilters(!showFilters)}
          >
            {isFilterActive ? (
              <FunnelIcon className="h-5 w-5 mr-1" />
            ) : (
              <AdjustmentsHorizontalIcon className="h-5 w-5 mr-1" />
            )}
            {isFilterActive ? 'Filters Active' : 'Filters'}
          </button>

          {isFilterActive && (
            <button
              type="button"
              className="flex items-center px-3 py-2 rounded-md text-sm font-medium bg-white dark:bg-gray-700 text-light-text-primary dark:text-gray-300 border border-light-border dark:border-gray-600 hover:bg-light-bg-secondary dark:hover:bg-gray-600"
              onClick={onResetFilters}
            >
              <XMarkIcon className="h-5 w-5 mr-1" />
              Clear
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-gray-400 mb-2">
              Interest Level
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <button
                  key={level}
                  type="button"
                  className={`px-3 py-1 rounded-md text-sm ${
                    (filters.interestLevel || []).includes(level)
                      ? 'bg-flash-green text-white'
                      : 'bg-white dark:bg-gray-700 text-light-text-primary dark:text-gray-300 border border-light-border dark:border-gray-600 hover:bg-light-bg-secondary dark:hover:bg-gray-600'
                  }`}
                  onClick={() => handleInterestLevelChange(level)}
                >
                  Level {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-gray-400 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`px-3 py-1 rounded-md text-sm ${
                  filters.signedUp === true
                    ? 'bg-flash-green text-white'
                    : 'bg-white dark:bg-gray-700 text-light-text-primary dark:text-gray-300 border border-light-border dark:border-gray-600 hover:bg-light-bg-secondary dark:hover:bg-gray-600'
                }`}
                onClick={() => handleSignedUpChange(true)}
              >
                Signed Up
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-md text-sm ${
                  filters.signedUp === false
                    ? 'bg-flash-green text-white'
                    : 'bg-white dark:bg-gray-700 text-light-text-primary dark:text-gray-300 border border-light-border dark:border-gray-600 hover:bg-light-bg-secondary dark:hover:bg-gray-600'
                }`}
                onClick={() => handleSignedUpChange(false)}
              >
                Prospect
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-gray-400 mb-2">
              Package Seen
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`px-3 py-1 rounded-md text-sm ${
                  filters.packageSeen === true
                    ? 'bg-flash-green text-white'
                    : 'bg-white dark:bg-gray-700 text-light-text-primary dark:text-gray-300 border border-light-border dark:border-gray-600 hover:bg-light-bg-secondary dark:hover:bg-gray-600'
                }`}
                onClick={() => handlePackageSeenChange(true)}
              >
                Yes
              </button>
              <button
                type="button"
                className={`px-3 py-1 rounded-md text-sm ${
                  filters.packageSeen === false
                    ? 'bg-flash-green text-white'
                    : 'bg-white dark:bg-gray-700 text-light-text-primary dark:text-gray-300 border border-light-border dark:border-gray-600 hover:bg-light-bg-secondary dark:hover:bg-gray-600'
                }`}
                onClick={() => handlePackageSeenChange(false)}
              >
                No
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-light-text-secondary dark:text-gray-400 mb-2">
              Sales Rep
            </label>
            <select
              className="w-full px-3 py-2 bg-white rounded-md text-light-text-primary border border-light-border focus:outline-none focus:ring-2 focus:ring-flash-green focus:border-flash-green"
              value={filters.username || ''}
              onChange={(e) => onFilterChange({
                ...filters,
                username: e.target.value || undefined
              })}
            >
              <option value="">All Reps</option>
              <option value="rogimon">rogimon</option>
              <option value="tatiana_1">tatiana_1</option>
              <option value="charms">charms</option>
              <option value="chala">chala</option>
              <option value="kandi">kandi</option>
              <option value="leah">leah</option>
              <option value="tamoy">tamoy</option>
              <option value="jodi">jodi</option>
              <option value="flash">flash</option>
              <option value="Unassigned">Unassigned</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-light-text-secondary dark:text-gray-400 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-light-text-tertiary mb-1">From</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-white rounded-md text-light-text-primary border border-light-border focus:outline-none focus:ring-2 focus:ring-flash-green focus:border-flash-green"
                  value={filters.dateRange?.start || ''}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      dateRange: {
                        ...filters.dateRange,
                        start: e.target.value || undefined,
                      },
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs text-light-text-tertiary mb-1">To</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 bg-white rounded-md text-light-text-primary border border-light-border focus:outline-none focus:ring-2 focus:ring-flash-green focus:border-flash-green"
                  value={filters.dateRange?.end || ''}
                  onChange={(e) =>
                    onFilterChange({
                      ...filters,
                      dateRange: {
                        ...filters.dateRange,
                        end: e.target.value || undefined,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}