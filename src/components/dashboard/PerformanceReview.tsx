import React from 'react';
import { useRepPerformanceStats } from '../../hooks/useRepTracking';
import { CheckCircleIcon, ExclamationCircleIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export function PerformanceReview() {
  const { data: performanceStats = [], isLoading } = useRepPerformanceStats();

  if (isLoading) {
    return (
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getPerformanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-500';
    if (rate >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStreakIcon = (streak: number) => {
    if (streak >= 5) return '🔥';
    if (streak >= 3) return '⭐';
    return '';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white">Performance Review</h2>
        <span className="text-sm text-gray-400">Weekly Compliance</span>
      </div>

      <div className="space-y-4">
        {performanceStats.map((rep) => (
          <div key={rep.repName} className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-white">{rep.repName}</h3>
              <div className="flex items-center space-x-2">
                {rep.mondayUpdateRate >= 90 && rep.tuesdayCallRate >= 90 && (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                )}
                {(rep.mondayUpdateRate < 70 || rep.tuesdayCallRate < 70) && (
                  <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-sm text-gray-400 mb-1">Monday Updates</p>
                <div className="flex items-center space-x-2">
                  <span className={`text-2xl font-bold ${getPerformanceColor(rep.mondayUpdateRate)}`}>
                    {rep.mondayUpdateRate.toFixed(0)}%
                  </span>
                  <span className="text-sm text-gray-500">
                    ({rep.mondayUpdatesSubmitted}/{rep.totalWeeks})
                  </span>
                  {rep.currentStreak.mondayUpdates >= 3 && (
                    <span className="text-lg">{getStreakIcon(rep.currentStreak.mondayUpdates)}</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-1">Tuesday Calls</p>
                <div className="flex items-center space-x-2">
                  <span className={`text-2xl font-bold ${getPerformanceColor(rep.tuesdayCallRate)}`}>
                    {rep.tuesdayCallRate.toFixed(0)}%
                  </span>
                  <span className="text-sm text-gray-500">
                    ({rep.tuesdayCallsAttended}/{rep.totalWeeks})
                  </span>
                  {rep.currentStreak.tuesdayCall >= 3 && (
                    <span className="text-lg">{getStreakIcon(rep.currentStreak.tuesdayCall)}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-700">
              <div className="flex items-center space-x-4">
                <div className="text-sm">
                  <span className="text-gray-400">Last 4 weeks:</span>
                  <span className="ml-2 text-white">
                    {rep.lastFourWeeks.mondayUpdates}/4 updates, {rep.lastFourWeeks.tuesdayCalls}/4 calls
                  </span>
                </div>
              </div>
              
              {rep.currentStreak.mondayUpdates >= 3 || rep.currentStreak.tuesdayCall >= 3 ? (
                <div className="flex items-center text-sm text-green-500">
                  <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                  <span>On streak!</span>
                </div>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {performanceStats.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          No performance data available yet. Start tracking rep performance to see stats here.
        </div>
      )}
    </div>
  );
}