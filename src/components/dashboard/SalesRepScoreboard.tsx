'use client';

import { useState } from 'react';
import { 
  TrophyIcon, 
  ChevronDownIcon, 
  ChevronUpIcon,
  ArrowPathIcon,
  FireIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { SalesRepStats } from '@/utils/rep-stats-calculator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SalesRepScoreboardProps {
  data: SalesRepStats[];
  isLoading?: boolean;
}

export default function SalesRepScoreboard({ data, isLoading = false }: SalesRepScoreboardProps) {
  const [sortBy, setSortBy] = useState<keyof SalesRepStats>('totalSubmissions');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (column: keyof SalesRepStats) => {
    if (column === sortBy) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
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

  // Get medal icon based on rank
  const getMedalIcon = (index: number) => {
    if (index === 0) return <TrophyIcon className="w-5 h-5 text-yellow-500" />;
    if (index === 1) return <TrophyIcon className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <TrophyIcon className="w-5 h-5 text-amber-600" />;
    return null;
  };

  // Get performance badge
  const getPerformanceBadge = (rate: number) => {
    if (rate >= 80) return { label: 'Excellent', color: 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700' };
    if (rate >= 60) return { label: 'Good', color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-700' };
    if (rate >= 40) return { label: 'Average', color: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700' };
    return { label: 'Needs Improvement', color: 'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-700' };
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 border-light-border dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-light-text-primary dark:text-white">Sales Rep Scoreboard</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-8 h-8 bg-light-bg-tertiary dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="bg-light-bg-tertiary dark:bg-gray-700 h-4 w-1/3 rounded mb-2"></div>
                  <div className="bg-light-bg-tertiary dark:bg-gray-700 h-3 w-1/2 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 border-light-border dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-light-text-primary dark:text-white">Sales Rep Scoreboard</CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-light-text-secondary dark:text-gray-400 hover:text-flash-green hover:bg-light-bg-secondary dark:hover:bg-gray-700"
          >
            <ArrowPathIcon className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-light-border dark:border-gray-700">
                <th className="pb-3 text-left">
                  <button
                    onClick={() => handleSort('username')}
                    className="flex items-center text-xs font-medium text-light-text-secondary dark:text-gray-400 hover:text-light-text-primary dark:hover:text-white transition-colors"
                  >
                    Rep Name
                    {sortBy === 'username' && (
                      sortDirection === 'desc' ? <ChevronDownIcon className="w-3 h-3 ml-1" /> : <ChevronUpIcon className="w-3 h-3 ml-1" />
                    )}
                  </button>
                </th>
                <th className="pb-3 text-center">
                  <button
                    onClick={() => handleSort('totalSubmissions')}
                    className="flex items-center justify-center text-xs font-medium text-light-text-secondary dark:text-gray-400 hover:text-light-text-primary dark:hover:text-white transition-colors mx-auto"
                  >
                    Submissions
                    {sortBy === 'totalSubmissions' && (
                      sortDirection === 'desc' ? <ChevronDownIcon className="w-3 h-3 ml-1" /> : <ChevronUpIcon className="w-3 h-3 ml-1" />
                    )}
                  </button>
                </th>
                <th className="pb-3 text-center">
                  <button
                    onClick={() => handleSort('signedUp')}
                    className="flex items-center justify-center text-xs font-medium text-light-text-secondary dark:text-gray-400 hover:text-light-text-primary dark:hover:text-white transition-colors mx-auto"
                  >
                    Signed Up
                    {sortBy === 'signedUp' && (
                      sortDirection === 'desc' ? <ChevronDownIcon className="w-3 h-3 ml-1" /> : <ChevronUpIcon className="w-3 h-3 ml-1" />
                    )}
                  </button>
                </th>
                <th className="pb-3 text-center">
                  <button
                    onClick={() => handleSort('conversionRate')}
                    className="flex items-center justify-center text-xs font-medium text-light-text-secondary dark:text-gray-400 hover:text-light-text-primary dark:hover:text-white transition-colors mx-auto"
                  >
                    Conversion
                    {sortBy === 'conversionRate' && (
                      sortDirection === 'desc' ? <ChevronDownIcon className="w-3 h-3 ml-1" /> : <ChevronUpIcon className="w-3 h-3 ml-1" />
                    )}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((rep, index) => {
                const performanceBadge = getPerformanceBadge(rep.conversionRate);
                return (
                  <tr key={rep.username} className="border-b border-light-border last:border-0 hover:bg-light-bg-secondary transition-colors">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        {getMedalIcon(index)}
                        <div>
                          <p className="font-medium text-light-text-primary">{rep.username}</p>
                          <div className="flex items-center gap-2 mt-1">
                            {rep.conversionRate > 70 && (
                              <FireIcon className="w-3 h-3 text-orange-500" />
                            )}
                            {rep.avgInterestLevel > 4 && (
                              <SparklesIcon className="w-3 h-3 text-purple-500" />
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-center">
                      <p className="text-sm font-semibold text-light-text-primary">{rep.totalSubmissions}</p>
                    </td>
                    <td className="py-4 text-center">
                      <p className="text-sm font-semibold text-light-text-primary">{rep.signedUp}</p>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-full max-w-[100px]">
                          <Progress value={rep.conversionRate} className="h-2" />
                        </div>
                        <Badge className={cn("text-xs", performanceBadge.color)}>
                          {rep.conversionRate.toFixed(0)}%
                        </Badge>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}