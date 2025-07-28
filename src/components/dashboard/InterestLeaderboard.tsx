'use client';

import { useState } from 'react';
import { 
  SparklesIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import { SalesRepStats } from '@/utils/rep-stats-calculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface InterestLeaderboardProps {
  repStats: SalesRepStats[];
  isLoading?: boolean;
}

export default function InterestLeaderboard({ repStats, isLoading = false }: InterestLeaderboardProps) {
  const [sortBy, setSortBy] = useState<keyof SalesRepStats>('totalInterestScore');
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
      className="px-4 py-3 text-left text-xs font-medium text-light-text-secondary uppercase tracking-wider whitespace-nowrap cursor-pointer hover:text-light-text-primary transition-colors"
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center">
        {label}
        {sortBy === column && (
          sortDirection === 'desc' ? <ChevronDownIcon className="w-3 h-3 ml-1" /> : <ChevronUpIcon className="w-3 h-3 ml-1" />
        )}
      </div>
    </th>
  );

  // Get max score for progress calculation
  const maxScore = Math.max(...repStats.map(r => r.totalInterestScore));

  if (isLoading) {
    return (
      <Card className="bg-white border-light-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-light-text-primary">Interest Level Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-light-bg-tertiary rounded-full"></div>
                <div className="flex-1">
                  <div className="bg-light-bg-tertiary h-4 w-1/3 rounded mb-2"></div>
                  <div className="bg-light-bg-tertiary h-3 w-1/2 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-light-border hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-flash-green" />
            <CardTitle className="text-lg font-semibold text-light-text-primary">Interest Level Leaderboard</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-light-border">
                <th className="w-12 px-2 py-3 text-center text-xs font-medium text-light-text-secondary uppercase">Rank</th>
                {renderHeaderCell('Rep', 'username')}
                {renderHeaderCell('Total Score', 'totalInterestScore')}
                {renderHeaderCell('Avg Interest', 'avgInterestLevel')}
              </tr>
            </thead>
            <tbody>
              {sortedData.slice(0, 5).map((rep, index) => (
                <tr key={rep.username} className="border-b border-light-border last:border-0 hover:bg-light-bg-secondary transition-colors">
                  <td className="px-2 py-3 text-center">
                    <span className="w-5 h-5 flex items-center justify-center">
                      {index < 3 ? (
                        <StarIcon className={cn(
                          "h-5 w-5",
                          index === 0 ? "text-yellow-500 fill-yellow-500" : 
                          index === 1 ? "text-gray-400 fill-gray-400" :
                          "text-amber-600 fill-amber-600"
                        )} />
                      ) : (
                        <span className="text-sm font-medium text-light-text-secondary">{index + 1}</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-light-text-primary">{rep.username}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-purple-600">{rep.totalInterestScore}</span>
                      <div className="w-24">
                        <Progress 
                          value={(rep.totalInterestScore / maxScore) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge 
                      variant={rep.avgInterestLevel >= 4 ? 'success' : rep.avgInterestLevel >= 3 ? 'warning' : 'secondary'}
                      className="text-xs"
                    >
                      {rep.avgInterestLevel.toFixed(1)}/5
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}