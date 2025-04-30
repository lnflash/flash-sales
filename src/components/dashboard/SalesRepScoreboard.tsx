'use client';

import { useState } from 'react';
import { 
  TrophyIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { SalesRepStats } from '@/utils/rep-stats-calculator';

interface SalesRepScoreboardProps {
  repStats: SalesRepStats[];
  isLoading?: boolean;
}

export default function SalesRepScoreboard({ repStats, isLoading = false }: SalesRepScoreboardProps) {
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
            <TrophyIcon className="h-5 w-5 mr-2 text-flash-yellow" />
            Sales Rep Leaderboard
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
          <TrophyIcon className="h-5 w-5 mr-2 text-flash-yellow" />
          Sales Rep Leaderboard
        </h2>
      </div>
      
      {repStats.length === 0 ? (
        <div className="py-12 text-center text-gray-400">
          <p>No sales rep data available</p>
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
                {renderHeaderCell('Submissions', 'totalSubmissions')}
                {renderHeaderCell('Signups', 'signedUp')}
                {renderHeaderCell('Conv. Rate', 'conversionRate')}
                {renderHeaderCell('Avg. Interest', 'avgInterestLevel')}
              </tr>
            </thead>
            <tbody className="divide-y divide-flash-dark-2">
              {sortedData.map((rep, index) => (
                <tr key={rep.username} className="hover:bg-flash-dark-2 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className={`flex items-center ${getMedalColor(index)}`}>
                      {index < 3 ? (
                        <TrophyIcon className="h-5 w-5 mr-1" />
                      ) : null}
                      {index + 1}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium">
                    {rep.username}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {rep.totalSubmissions}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium text-flash-green">
                      {rep.signedUp}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {rep.conversionRate.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-1/2 bg-flash-dark-2 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-flash-green to-flash-yellow h-2 rounded-full"
                          style={{ width: `${(rep.avgInterestLevel / 5) * 100}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm">{rep.avgInterestLevel.toFixed(1)}/5</span>
                    </div>
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