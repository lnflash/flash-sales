'use client';

import { useMemo } from 'react';
import { 
  FireIcon,
  CalendarDaysIcon,
  UserIcon
} from '@heroicons/react/24/outline';

interface HeatMapData {
  rep: string;
  periods: {
    period: string;
    value: number;
    conversions: number;
    submissions: number;
  }[];
}

interface PerformanceHeatMapProps {
  submissions: any[];
  isLoading?: boolean;
}

export default function PerformanceHeatMap({ submissions, isLoading = false }: PerformanceHeatMapProps) {
  const heatMapData = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];

    // Generate last 8 weeks
    const weeks: string[] = [];
    const now = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      weeks.push(weekLabel);
    }

    // Group submissions by rep
    const repSubmissions = new Map<string, any[]>();
    submissions.forEach(submission => {
      const username = submission.username || 'Unknown';
      if (!repSubmissions.has(username)) {
        repSubmissions.set(username, []);
      }
      repSubmissions.get(username)!.push(submission);
    });

    // Calculate performance for each rep across time periods
    const heatMapData: HeatMapData[] = [];
    
    repSubmissions.forEach((repSubs, rep) => {
      const periods = weeks.map(week => {
        // Find submissions for this week
        const [month, day] = week.split('/').map(Number);
        const weekStart = new Date(now.getFullYear(), month - 1, day);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekSubmissions = repSubs.filter(sub => {
          const subDate = new Date(sub.timestamp);
          return subDate >= weekStart && subDate <= weekEnd;
        });

        const conversions = weekSubmissions.filter(sub => sub.signedUp).length;
        const conversionRate = weekSubmissions.length > 0 
          ? (conversions / weekSubmissions.length) * 100 
          : 0;

        return {
          period: week,
          value: conversionRate,
          conversions,
          submissions: weekSubmissions.length
        };
      });

      heatMapData.push({
        rep,
        periods
      });
    });

    // Sort by total performance
    return heatMapData
      .filter(rep => rep.periods.some(p => p.submissions > 0))
      .sort((a, b) => {
        const aTotal = a.periods.reduce((sum, p) => sum + p.value, 0);
        const bTotal = b.periods.reduce((sum, p) => sum + p.value, 0);
        return bTotal - aTotal;
      })
      .slice(0, 10); // Top 10 reps
  }, [submissions]);

  const getHeatMapColor = (value: number): string => {
    if (value === 0) return 'bg-gray-800';
    if (value < 10) return 'bg-red-900';
    if (value < 20) return 'bg-red-700';
    if (value < 30) return 'bg-yellow-700';
    if (value < 40) return 'bg-yellow-500';
    if (value < 50) return 'bg-green-700';
    return 'bg-green-500';
  };

  const getTextColor = (value: number): string => {
    return value > 30 ? 'text-white' : 'text-gray-300';
  };

  if (isLoading) {
    return (
      <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-flash-dark-2 rounded w-1/3 mb-6"></div>
          <div className="h-96 bg-flash-dark-2 rounded"></div>
        </div>
      </div>
    );
  }

  if (heatMapData.length === 0) {
    return (
      <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
        <div className="flex items-center justify-center h-96 text-gray-400">
          <p>No performance data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white flex items-center">
            <FireIcon className="h-5 w-5 mr-2 text-orange-500" />
            Performance Heat Map
          </h3>
          <p className="text-sm text-gray-400 mt-1">Conversion rates by rep over time</p>
        </div>
        <div className="flex items-center space-x-4 text-xs text-gray-400">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-900 rounded"></div>
            <span>0-10%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-700 rounded"></div>
            <span>20-30%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>50%+</span>
          </div>
        </div>
      </div>

      {/* Heat Map Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Column Headers */}
          <div className="grid grid-cols-9 gap-1 mb-2">
            <div className="text-xs text-gray-400 font-medium p-2">
              <UserIcon className="h-4 w-4" />
            </div>
            {heatMapData[0]?.periods.map(period => (
              <div key={period.period} className="text-xs text-gray-400 font-medium p-2 text-center">
                {period.period}
              </div>
            ))}
          </div>

          {/* Heat Map Rows */}
          <div className="space-y-1">
            {heatMapData.map(rep => (
              <div key={rep.rep} className="grid grid-cols-9 gap-1">
                {/* Rep Name */}
                <div className="text-sm text-white font-medium p-3 bg-flash-dark-2 rounded flex items-center">
                  <span className="truncate">{rep.rep}</span>
                </div>
                
                {/* Performance Cells */}
                {rep.periods.map(period => (
                  <div
                    key={`${rep.rep}-${period.period}`}
                    className={`
                      p-3 rounded text-center transition-colors group cursor-pointer
                      ${getHeatMapColor(period.value)}
                      hover:ring-2 hover:ring-white hover:ring-opacity-50
                    `}
                    title={`${rep.rep} - ${period.period}: ${period.value.toFixed(1)}% (${period.conversions}/${period.submissions})`}
                  >
                    <div className={`text-xs font-bold ${getTextColor(period.value)}`}>
                      {period.value > 0 ? period.value.toFixed(0) + '%' : '-'}
                    </div>
                    {period.submissions > 0 && (
                      <div className="text-xs opacity-75 mt-1">
                        {period.conversions}/{period.submissions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-flash-dark-2 rounded-lg p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
            Top Performer
          </div>
          <div className="text-lg font-bold text-flash-green">
            {heatMapData[0]?.rep || 'N/A'}
          </div>
          <div className="text-sm text-gray-300">
            {heatMapData[0] ? 
              `${(heatMapData[0].periods.reduce((sum, p) => sum + p.value, 0) / heatMapData[0].periods.length).toFixed(1)}% avg` 
              : 'No data'
            }
          </div>
        </div>

        <div className="bg-flash-dark-2 rounded-lg p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
            Team Average
          </div>
          <div className="text-lg font-bold text-flash-yellow">
            {heatMapData.length > 0 ? 
              (heatMapData.reduce((sum, rep) => 
                sum + rep.periods.reduce((periodSum, p) => periodSum + p.value, 0) / rep.periods.length, 0
              ) / heatMapData.length).toFixed(1) : '0.0'
            }%
          </div>
          <div className="text-sm text-gray-300">
            Conversion rate
          </div>
        </div>

        <div className="bg-flash-dark-2 rounded-lg p-4">
          <div className="text-xs text-gray-400 uppercase tracking-wide mb-1">
            Active Reps
          </div>
          <div className="text-lg font-bold text-blue-400">
            {heatMapData.length}
          </div>
          <div className="text-sm text-gray-300">
            This period
          </div>
        </div>
      </div>
    </div>
  );
}