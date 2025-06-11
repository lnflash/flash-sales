'use client';

import { useState } from 'react';
import { 
  CheckCircleIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { SalesRepStats } from '@/utils/rep-stats-calculator';

interface SignupLeaderboardProps {
  repStats: SalesRepStats[];
  isLoading?: boolean;
}

export default function SignupLeaderboard({ repStats, isLoading = false }: SignupLeaderboardProps) {
  const [sortBy, setSortBy] = useState<keyof SalesRepStats>('signedUp');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: keyof SalesRepStats) => {
    if (column === sortBy) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const sortedData = [...repStats].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'desc' ? bValue - aValue : aValue - bValue;
    }
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'desc' 
        ? bValue.localeCompare(aValue) 
        : aValue.localeCompare(bValue);
    }
    
    return 0;
  });

  // Helper to render header cell with sort icons
  const renderHeaderCell = (label: string, column: keyof SalesRepStats) => (
    <th 
      className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap cursor-pointer"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center">
        {label}
        {sortBy === column ? (
          sortDirection === 'desc' ? (
            <ChevronDownIcon className="w-4 h-4 ml-1" />
          ) : (
            <ChevronUpIcon className="w-4 h-4 ml-1" />
          )
        ) : (
          <ChevronUpIcon className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-50" />
        )}
      </div>
    </th>
  );

  // Get medal color based on rank
  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-yellow-500'; // Gold
    if (index === 1) return 'text-gray-300'; // Silver
    if (index === 2) return 'text-amber-700'; // Bronze
    return 'text-gray-600'; // Others
  };

  if (isLoading) {
    return (
      <div className="bg-flash-dark-3 rounded-lg shadow-md overflow-hidden mb-8">
        <div className="p-4 border-b border-flash-dark-2">
          <h2 className="text-lg font-medium text-white flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2 text-flash-green" />
            Signup Leaderboard
          </h2>
        </div>
        <div className="animate-pulse">
          <div className="h-12 bg-flash-dark-2"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 border-t border-flash-dark-2"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-flash-dark-3 rounded-lg shadow-md overflow-hidden mb-8">
      <div className="p-4 border-b border-flash-dark-2">
        <h2 className="text-lg font-medium text-white flex items-center">
          <CheckCircleIcon className="h-5 w-5 mr-2 text-flash-green" />
          Signup Leaderboard
        </h2>
      </div>
      
      {repStats.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <p>No signup data available</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-flash-dark-2">
            <thead className="bg-flash-dark-2">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Rank
                </th>
                {renderHeaderCell('Rep', 'username')}
                {renderHeaderCell('Signups', 'signedUp')}
                {renderHeaderCell('Conv. Rate', 'conversionRate')}
                {renderHeaderCell('Total Subs', 'totalSubmissions')}
              </tr>
            </thead>
            <tbody className="divide-y divide-flash-dark-2">
              {sortedData.map((rep, index) => (
                <tr key={rep.username} className="hover:bg-flash-dark-2 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className={`flex items-center ${getMedalColor(index)}`}>
                      {index < 3 ? (
                        <CheckCircleIcon className="h-5 w-5 mr-1" />
                      ) : null}
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">
                    {rep.username}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-bold text-flash-green text-lg">
                      {rep.signedUp}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`font-medium ${rep.conversionRate > 0 ? 'text-flash-yellow' : 'text-gray-400'}`}>
                      {rep.conversionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-300">
                    {rep.totalSubmissions}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}