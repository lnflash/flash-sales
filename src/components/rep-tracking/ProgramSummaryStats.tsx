import React from 'react';
import { 
  UsersIcon, 
  ChartBarIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';

interface ProgramSummaryStatsProps {
  aggregateMetrics: {
    totalReps: number;
    totalActivities: number;
    totalCompleted: number;
    averageCompletionRate: number;
    topPerformer: { username: string; metrics: { completionRate: number } } | null;
    bottomPerformer: { username: string; metrics: { completionRate: number } } | null;
  };
  weekOffset: number;
}

export const ProgramSummaryStats: React.FC<ProgramSummaryStatsProps> = ({ 
  aggregateMetrics,
  weekOffset 
}) => {
  const weekLabel = weekOffset === 0 ? 'This Week' : 
                    weekOffset === 1 ? 'Last Week' : 
                    `${weekOffset} Weeks Ago`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Total Reps Active */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Active Reps</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {aggregateMetrics.totalReps}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{weekLabel}</p>
          </div>
          <div className="p-3 bg-primary/10 rounded-lg">
            <UsersIcon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>

      {/* Total Activities */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Activities</p>
            <p className="text-2xl font-bold text-foreground mt-1">
              {aggregateMetrics.totalActivities}
            </p>
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              {aggregateMetrics.totalCompleted} completed
            </p>
          </div>
          <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
            <CalendarDaysIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
      </div>

      {/* Average Completion Rate */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Avg Completion</p>
            <p className={`text-2xl font-bold mt-1 ${
              aggregateMetrics.averageCompletionRate >= 75 
                ? 'text-green-600 dark:text-green-400' 
                : aggregateMetrics.averageCompletionRate >= 50
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400'
            }`}>
              {aggregateMetrics.averageCompletionRate}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Team average</p>
          </div>
          <div className={`p-3 rounded-lg ${
            aggregateMetrics.averageCompletionRate >= 75 
              ? 'bg-green-100 dark:bg-green-900/20' 
              : aggregateMetrics.averageCompletionRate >= 50
              ? 'bg-yellow-100 dark:bg-yellow-900/20'
              : 'bg-red-100 dark:bg-red-900/20'
          }`}>
            <ChartBarIcon className={`h-6 w-6 ${
              aggregateMetrics.averageCompletionRate >= 75 
                ? 'text-green-600 dark:text-green-400' 
                : aggregateMetrics.averageCompletionRate >= 50
                ? 'text-yellow-600 dark:text-yellow-400'
                : 'text-red-600 dark:text-red-400'
            }`} />
          </div>
        </div>
      </div>

      {/* Performance Range */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex flex-col h-full">
          <p className="text-sm text-muted-foreground mb-3">Performance Range</p>
          <div className="flex-1 space-y-2">
            {aggregateMetrics.topPerformer && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-foreground">
                    {aggregateMetrics.topPerformer.username}
                  </span>
                </div>
                <span className="text-sm font-semibold text-green-600 dark:text-green-400">
                  {aggregateMetrics.topPerformer.metrics.completionRate}%
                </span>
              </div>
            )}
            {aggregateMetrics.bottomPerformer && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ExclamationTriangleIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  <span className="text-sm font-medium text-foreground">
                    {aggregateMetrics.bottomPerformer.username}
                  </span>
                </div>
                <span className="text-sm font-semibold text-orange-600 dark:text-orange-400">
                  {aggregateMetrics.bottomPerformer.metrics.completionRate}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};