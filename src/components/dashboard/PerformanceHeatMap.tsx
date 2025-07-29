'use client';

import { useMemo } from 'react';
import { 
  FireIcon,
  CalendarDaysIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent } from '@/components/ui/card';

interface HeatMapData {
  territory: string;
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

    // Group submissions by territory
    const territorySubmissions = new Map<string, any[]>();
    submissions.forEach(submission => {
      const territory = submission.territory || 'Unknown';
      if (!territorySubmissions.has(territory)) {
        territorySubmissions.set(territory, []);
      }
      territorySubmissions.get(territory)!.push(submission);
    });

    // Calculate performance for each territory across time periods
    const heatMapData: HeatMapData[] = [];
    
    territorySubmissions.forEach((territorySubs, territory) => {
      const periods = weeks.map(week => {
        // Find submissions for this week
        const [month, day] = week.split('/').map(Number);
        const weekStart = new Date(now.getFullYear(), month - 1, day);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekSubmissions = territorySubs.filter(sub => {
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
        territory,
        periods
      });
    });

    // Sort by total performance
    return heatMapData
      .filter(territory => territory.periods.some(p => p.submissions > 0))
      .sort((a, b) => {
        const aTotal = a.periods.reduce((sum, p) => sum + p.value, 0);
        const bTotal = b.periods.reduce((sum, p) => sum + p.value, 0);
        return bTotal - aTotal;
      })
      .slice(0, 10); // Top 10 territories
  }, [submissions]);

  const getHeatMapColor = (value: number): string => {
    if (value === 0) return 'bg-gray-100';
    if (value < 10) return 'bg-red-100';
    if (value < 20) return 'bg-red-200';
    if (value < 30) return 'bg-yellow-100';
    if (value < 40) return 'bg-yellow-200';
    if (value < 50) return 'bg-green-100';
    return 'bg-green-200';
  };

  const getTextColor = (value: number): string => {
    return value > 30 ? 'text-gray-800' : 'text-gray-600';
  };

  if (isLoading) {
    return (
      <Card className="bg-white border-light-border">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-light-bg-tertiary rounded w-1/3 mb-6"></div>
            <div className="h-96 bg-light-bg-tertiary rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (heatMapData.length === 0) {
    return (
      <Card className="bg-white border-light-border">
        <CardContent className="flex items-center justify-center h-96 p-6">
          <p className="text-light-text-tertiary">No performance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-light-border hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-light-text-primary flex items-center">
            <FireIcon className="h-5 w-5 mr-2 text-flash-green" />
            Performance Heat Map
          </h3>
          <p className="text-sm text-light-text-secondary mt-1">Conversion rates by territory over time</p>
        </div>
        <div className="flex items-center space-x-4 text-xs text-light-text-tertiary">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-200 rounded"></div>
            <span>0-10%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-200 rounded"></div>
            <span>20-30%</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-200 rounded"></div>
            <span>50%+</span>
          </div>
        </div>
      </div>

      {/* Heat Map Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Column Headers */}
          <div className="grid grid-cols-9 gap-1 mb-2">
            <div className="text-xs text-light-text-tertiary font-medium p-2">
              <UserIcon className="h-4 w-4" />
            </div>
            {heatMapData[0]?.periods.map(period => (
              <div key={period.period} className="text-xs text-light-text-tertiary font-medium p-2 text-center">
                {period.period}
              </div>
            ))}
          </div>

          {/* Heat Map Rows */}
          <div className="space-y-1">
            {heatMapData.map(item => (
              <div key={item.territory} className="grid grid-cols-9 gap-1">
                {/* Territory Name */}
                <div className="text-sm text-light-text-primary font-medium p-3 bg-light-bg-secondary border border-light-border rounded flex items-center">
                  <span className="truncate">{item.territory}</span>
                </div>
                
                {/* Performance Cells */}
                {item.periods.map(period => (
                  <div
                    key={`${item.territory}-${period.period}`}
                    className={`
                      p-3 rounded text-center transition-colors group cursor-pointer
                      ${getHeatMapColor(period.value)}
                      hover:ring-2 hover:ring-flash-green hover:ring-opacity-50
                    `}
                    title={`${item.territory} - ${period.period}: ${period.value.toFixed(1)}% (${period.conversions}/${period.submissions})`}
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
          <div className="bg-light-bg-secondary rounded-lg p-4 border border-light-border">
            <div className="text-xs text-light-text-secondary uppercase tracking-wide mb-1">
              Top Performer
            </div>
            <div className="text-lg font-bold text-flash-green">
              {heatMapData[0]?.territory || 'N/A'}
            </div>
            <div className="text-sm text-light-text-primary">
              {heatMapData[0] ? 
                `${(heatMapData[0].periods.reduce((sum, p) => sum + p.value, 0) / heatMapData[0].periods.length).toFixed(1)}% avg` 
                : 'No data'
              }
            </div>
          </div>

          <div className="bg-light-bg-secondary rounded-lg p-4 border border-light-border">
            <div className="text-xs text-light-text-secondary uppercase tracking-wide mb-1">
              Team Average
            </div>
            <div className="text-lg font-bold text-amber-600">
              {heatMapData.length > 0 ? 
                (heatMapData.reduce((sum, territory) => 
                  sum + territory.periods.reduce((periodSum, p) => periodSum + p.value, 0) / territory.periods.length, 0
                ) / heatMapData.length).toFixed(1) : '0.0'
              }%
            </div>
            <div className="text-sm text-light-text-primary">
              Conversion rate
            </div>
          </div>

          <div className="bg-light-bg-secondary rounded-lg p-4 border border-light-border">
            <div className="text-xs text-light-text-secondary uppercase tracking-wide mb-1">
              Active Territories
            </div>
            <div className="text-lg font-bold text-blue-600">
              {heatMapData.length}
            </div>
            <div className="text-sm text-light-text-primary">
              This period
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}