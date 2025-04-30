'use client';

import { 
  TrophyIcon,
  UserIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

interface SalesRepStat {
  username: string;
  submissions: number;
  conversions: number;
  conversionRate: number;
  avgInterestLevel: number;
}

interface SalesRepPerformanceChartProps {
  data: SalesRepStat[];
  isLoading?: boolean;
}

export default function SalesRepPerformanceChart({ data, isLoading = false }: SalesRepPerformanceChartProps) {
  // Get color based on conversion rate
  const getConversionRateColor = (rate: number) => {
    if (rate >= 75) return 'bg-flash-green';
    if (rate >= 50) return 'bg-flash-yellow';
    if (rate >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  // Get color based on interest level
  const getInterestLevelColor = (level: number) => {
    if (level >= 4) return 'text-flash-green';
    if (level >= 3) return 'text-flash-yellow';
    if (level >= 2) return 'text-orange-500';
    return 'text-red-500';
  };

  // Get icon based on rank
  const getMedalIcon = (index: number) => {
    if (index === 0) return <TrophyIcon className="h-5 w-5 text-yellow-500" />; // Gold
    if (index === 1) return <TrophyIcon className="h-5 w-5 text-gray-300" />; // Silver
    if (index === 2) return <TrophyIcon className="h-5 w-5 text-amber-700" />; // Bronze
    return null;
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 text-gray-500 animate-spin" />
        <p className="mt-2 text-sm text-gray-500">Loading data...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Take top 5 reps by conversion rate
  const topReps = [...data].slice(0, 5);

  return (
    <div className="h-full">
      <div className="space-y-3">
        {topReps.map((rep, index) => (
          <div key={rep.username} className="bg-flash-dark-2 rounded-lg p-3">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center">
                <div className="mr-2">
                  {getMedalIcon(index) || <UserIcon className="h-5 w-5 text-gray-400" />}
                </div>
                <span className="font-medium text-white">{rep.username}</span>
              </div>
              <div className="flex items-center">
                <SparklesIcon className={`h-4 w-4 mr-1 ${getInterestLevelColor(rep.avgInterestLevel)}`} />
                <span className={`text-sm ${getInterestLevelColor(rep.avgInterestLevel)}`}>
                  {rep.avgInterestLevel.toFixed(1)}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-3 text-center text-sm mb-2">
              <div>
                <p className="text-xs text-gray-400">Submissions</p>
                <p className="font-medium text-white">{rep.submissions}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Conversions</p>
                <p className="font-medium text-flash-green">{rep.conversions}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Conv. Rate</p>
                <p className="font-medium text-flash-yellow">{rep.conversionRate.toFixed(1)}%</p>
              </div>
            </div>
            
            {/* Conversion rate progress bar */}
            <div className="w-full bg-flash-dark-3 rounded-full h-2">
              <div 
                className={`${getConversionRateColor(rep.conversionRate)} h-2 rounded-full`} 
                style={{ width: `${Math.min(100, rep.conversionRate)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}