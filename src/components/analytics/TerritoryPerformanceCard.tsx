import React from 'react';
import { TerritoryMetrics } from '@/types/territory-analytics';
import {
  TrendingUpIcon,
  TrendingDownIcon,
  UserGroupIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface TerritoryPerformanceCardProps {
  territory: TerritoryMetrics;
  rank?: number;
  showTrend?: boolean;
  isUnderperforming?: boolean;
  onClick?: () => void;
}

export default function TerritoryPerformanceCard({
  territory,
  rank,
  showTrend = false,
  isUnderperforming = false,
  onClick
}: TerritoryPerformanceCardProps) {
  const performanceColor = isUnderperforming ? 'text-red-600' : 'text-green-600';
  const bgColor = isUnderperforming ? 'bg-red-50 dark:bg-red-900/20' : 'bg-green-50 dark:bg-green-900/20';
  
  return (
    <div
      className={`p-4 rounded-lg border ${isUnderperforming ? 'border-red-200 dark:border-red-800' : 'border-green-200 dark:border-green-800'} ${bgColor} cursor-pointer hover:shadow-md transition-all`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          {rank && (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isUnderperforming ? 'bg-red-200 text-red-700 dark:bg-red-800 dark:text-red-200' : 'bg-green-200 text-green-700 dark:bg-green-800 dark:text-green-200'}`}>
              {rank}
            </div>
          )}
          <div>
            <h4 className="font-semibold text-foreground">{territory.territoryName}</h4>
            {territory.parentTerritoryName && (
              <p className="text-xs text-muted-foreground">{territory.parentTerritoryName}</p>
            )}
          </div>
        </div>
        
        {showTrend && (
          <div className={`flex items-center gap-1 ${performanceColor}`}>
            {isUnderperforming ? (
              <TrendingDownIcon className="w-4 h-4" />
            ) : (
              <TrendingUpIcon className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">
              {territory.conversionRate.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-2 text-sm">
        <div className="text-center">
          <div className="flex items-center justify-center text-muted-foreground mb-1">
            <ChartBarIcon className="w-4 h-4" />
          </div>
          <p className="font-semibold text-foreground">{territory.totalLeads}</p>
          <p className="text-xs text-muted-foreground">Leads</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center text-green-600 mb-1">
            <TrendingUpIcon className="w-4 h-4" />
          </div>
          <p className="font-semibold text-foreground">{territory.convertedLeads}</p>
          <p className="text-xs text-muted-foreground">Won</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center text-blue-600 mb-1">
            <ClockIcon className="w-4 h-4" />
          </div>
          <p className="font-semibold text-foreground">{territory.avgTimeToClose.toFixed(0)}d</p>
          <p className="text-xs text-muted-foreground">Avg Close</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center text-purple-600 mb-1">
            <UserGroupIcon className="w-4 h-4" />
          </div>
          <p className="font-semibold text-foreground">{territory.assignedReps}</p>
          <p className="text-xs text-muted-foreground">Reps</p>
        </div>
      </div>

      {territory.activeLeads > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Active opportunities</span>
            <span className="font-medium text-orange-600">{territory.activeLeads}</span>
          </div>
        </div>
      )}
    </div>
  );
}