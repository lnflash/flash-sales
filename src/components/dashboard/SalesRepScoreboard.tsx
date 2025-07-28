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
    if (index === 0) return <TrophyIcon className="w-5 h-5 text-flash-yellow" />;
    if (index === 1) return <TrophyIcon className="w-5 h-5 text-gray-400" />;
    if (index === 2) return <TrophyIcon className="w-5 h-5 text-amber-600" />;
    return null;
  };

  const getPerformanceBadge = (conversionRate: number) => {
    if (conversionRate >= 50) return <Badge variant="success">Top Performer</Badge>;
    if (conversionRate >= 30) return <Badge variant="warning">Strong</Badge>;
    if (conversionRate >= 20) return <Badge>Average</Badge>;
    return <Badge variant="secondary">Needs Coaching</Badge>;
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrophyIcon className="w-5 h-5 text-flash-yellow" />
            Sales Rep Scoreboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="p-3 bg-gray-700/50 rounded-lg">
                <div className="h-5 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-600 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const maxSubmissions = Math.max(...sortedData.map(rep => rep.totalSubmissions));

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrophyIcon className="w-5 h-5 text-flash-yellow" />
          Sales Rep Scoreboard
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-900/50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-medium text-xs uppercase tracking-wider"
                    onClick={() => handleSort('username')}
                  >
                    Sales Rep
                    {sortBy === 'username' && (
                      sortDirection === 'desc' ? 
                        <ChevronDownIcon className="w-3 h-3 ml-1 inline" /> : 
                        <ChevronUpIcon className="w-3 h-3 ml-1 inline" />
                    )}
                  </Button>
                </th>
                <th className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-medium text-xs uppercase tracking-wider"
                    onClick={() => handleSort('totalSubmissions')}
                  >
                    Leads
                    {sortBy === 'totalSubmissions' && (
                      sortDirection === 'desc' ? 
                        <ChevronDownIcon className="w-3 h-3 ml-1 inline" /> : 
                        <ChevronUpIcon className="w-3 h-3 ml-1 inline" />
                    )}
                  </Button>
                </th>
                <th className="px-4 py-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-medium text-xs uppercase tracking-wider"
                    onClick={() => handleSort('signedUp')}
                  >
                    Conversions
                    {sortBy === 'signedUp' && (
                      sortDirection === 'desc' ? 
                        <ChevronDownIcon className="w-3 h-3 ml-1 inline" /> : 
                        <ChevronUpIcon className="w-3 h-3 ml-1 inline" />
                    )}
                  </Button>
                </th>
                <th className="px-4 py-3 hidden md:table-cell">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="font-medium text-xs uppercase tracking-wider"
                    onClick={() => handleSort('conversionRate')}
                  >
                    Rate
                    {sortBy === 'conversionRate' && (
                      sortDirection === 'desc' ? 
                        <ChevronDownIcon className="w-3 h-3 ml-1 inline" /> : 
                        <ChevronUpIcon className="w-3 h-3 ml-1 inline" />
                    )}
                  </Button>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sortedData.map((rep, index) => (
                <tr 
                  key={rep.username}
                  className={cn(
                    "hover:bg-gray-700/30 transition-colors",
                    index < 3 && "bg-gray-700/20"
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {getMedalIcon(index)}
                      <div>
                        <div className="font-medium text-white">{rep.username}</div>
                        <div className="text-xs text-muted-foreground">
                          Avg Interest: {rep.avgInterestLevel.toFixed(1)}/10
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-white">
                        {rep.totalSubmissions}
                      </div>
                      <Progress 
                        value={rep.totalSubmissions} 
                        max={maxSubmissions}
                        className="h-1.5"
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-1">
                        <span className="text-xl font-bold text-flash-green">
                          {rep.signedUp}
                        </span>
                        {rep.signedUp >= 5 && (
                          <FireIcon className="w-4 h-4 text-orange-500" />
                        )}
                      </div>
                      {rep.totalInterestScore > 30 && (
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          <SparklesIcon className="w-3 h-3" />
                          {rep.totalInterestScore} interest pts
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <div className="space-y-1">
                      <div className="text-lg font-semibold">
                        {rep.conversionRate.toFixed(0)}%
                      </div>
                      {getPerformanceBadge(rep.conversionRate)}
                    </div>
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