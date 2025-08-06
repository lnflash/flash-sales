"use client";

import { useMemo } from "react";
import { FireIcon, CalendarDaysIcon, UserIcon } from "@heroicons/react/24/outline";
import { Card, CardContent } from "@/components/ui/card";

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
      weekStart.setDate(now.getDate() - i * 7);
      const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      weeks.push(weekLabel);
    }

    // Group submissions by territory
    const territorySubmissions = new Map<string, any[]>();
    submissions.forEach((submission) => {
      const territory = submission.territory || "Unknown";
      if (!territorySubmissions.has(territory)) {
        territorySubmissions.set(territory, []);
      }
      territorySubmissions.get(territory)!.push(submission);
    });

    // Calculate performance for each territory across time periods
    const heatMapData: HeatMapData[] = [];

    territorySubmissions.forEach((territorySubs, territory) => {
      const periods = weeks.map((week) => {
        // Find submissions for this week
        const [month, day] = week.split("/").map(Number);
        const weekStart = new Date(now.getFullYear(), month - 1, day);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekSubmissions = territorySubs.filter((sub) => {
          const subDate = new Date(sub.timestamp);
          return subDate >= weekStart && subDate <= weekEnd;
        });

        const conversions = weekSubmissions.filter((sub) => sub.signedUp).length;
        const conversionRate = weekSubmissions.length > 0 ? (conversions / weekSubmissions.length) * 100 : 0;

        return {
          period: week,
          value: conversionRate,
          conversions,
          submissions: weekSubmissions.length,
        };
      });

      heatMapData.push({
        territory,
        periods,
      });
    });

    // Sort by total performance
    return heatMapData
      .filter((territory) => territory.periods.some((p) => p.submissions > 0))
      .sort((a, b) => {
        const aTotal = a.periods.reduce((sum, p) => sum + p.value, 0);
        const bTotal = b.periods.reduce((sum, p) => sum + p.value, 0);
        return bTotal - aTotal;
      })
      .slice(0, 10); // Top 10 territories
  }, [submissions]);

  const getHeatMapColor = (value: number): string => {
    if (value === 0) return "bg-gray-100 dark:bg-gray-800";
    if (value < 10) return "bg-red-100 dark:bg-red-900/30";
    if (value < 20) return "bg-red-200 dark:bg-red-800/40";
    if (value < 30) return "bg-yellow-100 dark:bg-yellow-900/30";
    if (value < 40) return "bg-yellow-200 dark:bg-yellow-800/40";
    if (value < 50) return "bg-green-100 dark:bg-green-900/30";
    return "bg-green-200 dark:bg-green-800/40";
  };

  const getTextColor = (value: number): string => {
    return value > 30 ? "text-gray-800 dark:text-gray-200" : "text-gray-600 dark:text-gray-300";
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
            <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (heatMapData.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardContent className="flex items-center justify-center h-96 p-6">
          <p className="text-gray-500 dark:text-gray-400">No performance data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <FireIcon className="h-5 w-5 mr-2 text-flash-green" />
              Performance Heat Map
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">Conversion rates by territory over time</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-200 dark:bg-red-800/40 rounded"></div>
              <span>0-10%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-200 dark:bg-yellow-800/40 rounded"></div>
              <span>20-30%</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-200 dark:bg-green-800/40 rounded"></div>
              <span>50%+</span>
            </div>
          </div>
        </div>

        {/* Heat Map Grid - Mobile Responsive */}
        <div className="overflow-x-auto">
          <div className="min-w-[700px]">
            {/* Header Row */}
            <div className="flex mb-2">
              <div className="w-28 sm:w-32 md:w-40 p-2 text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center">
                <UserIcon className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Territory</span>
              </div>
              <div className="flex-1 grid grid-cols-8 gap-1">
                {heatMapData[0]?.periods.map((period) => (
                  <div key={period.period} className="text-xs text-gray-500 dark:text-gray-400 font-medium p-2 text-center">
                    {period.period}
                  </div>
                ))}
              </div>
            </div>

            {/* Data Rows */}
            <div className="space-y-1">
              {heatMapData.map((item) => (
                <div key={item.territory} className="flex">
                  {/* Territory Name Column */}
                  <div className="w-28 sm:w-32 md:w-40 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-l flex items-center">
                    <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white leading-tight break-words">{item.territory}</span>
                  </div>

                  {/* Performance Cells */}
                  <div className="flex-1 grid grid-cols-8 gap-1">
                    {item.periods.map((period, index) => (
                      <div
                        key={`${item.territory}-${period.period}`}
                        className={`
                        h-12 sm:h-16 p-1 sm:p-2 text-center transition-colors group cursor-pointer flex flex-col justify-center
                        ${getHeatMapColor(period.value)}
                        hover:ring-2 hover:ring-flash-green hover:ring-opacity-50
                        ${index === item.periods.length - 1 ? "rounded-r" : ""}
                      `}
                        title={`${item.territory} - ${period.period}: ${period.value.toFixed(1)}% (${period.conversions}/${period.submissions})`}
                      >
                        <div className={`text-xs font-bold ${getTextColor(period.value)}`}>{period.value > 0 ? period.value.toFixed(0) + "%" : "-"}</div>
                        {period.submissions > 0 && (
                          <div className={`text-xs opacity-75 mt-0.5 ${getTextColor(period.value)} hidden sm:block`}>
                            {period.conversions}/{period.submissions}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1">Top Performer</div>
            <div className="text-lg font-bold text-flash-green">{heatMapData[0]?.territory || "N/A"}</div>
            <div className="text-sm text-gray-900 dark:text-white">
              {heatMapData[0] ? `${(heatMapData[0].periods.reduce((sum, p) => sum + p.value, 0) / heatMapData[0].periods.length).toFixed(1)}% avg` : "No data"}
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1">Team Average</div>
            <div className="text-lg font-bold text-amber-500 dark:text-amber-400">
              {heatMapData.length > 0
                ? (
                    heatMapData.reduce(
                      (sum, territory) => sum + territory.periods.reduce((periodSum, p) => periodSum + p.value, 0) / territory.periods.length,
                      0
                    ) / heatMapData.length
                  ).toFixed(1)
                : "0.0"}
              %
            </div>
            <div className="text-sm text-gray-900 dark:text-white">Conversion rate</div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
            <div className="text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1">Active Territories</div>
            <div className="text-lg font-bold text-blue-500 dark:text-blue-400">{heatMapData.length}</div>
            <div className="text-sm text-gray-900 dark:text-white">This period</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
