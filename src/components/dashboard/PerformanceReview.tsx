import React from 'react';
import { useRepPerformanceStats } from '../../hooks/useRepTracking';
import { CheckCircleIcon, ExclamationCircleIcon, ArrowTrendingUpIcon } from '@heroicons/react/24/outline';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

export function PerformanceReview() {
  const { data: performanceStats = [], isLoading } = useRepPerformanceStats();

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg">Performance Review</CardTitle>
          <CardDescription>Weekly Compliance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 bg-gray-700/50 rounded-lg">
                <div className="h-5 bg-gray-600 rounded w-1/3 mb-3"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-16 bg-gray-600 rounded"></div>
                  <div className="h-16 bg-gray-600 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
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
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Performance Review</CardTitle>
          <Badge variant="outline" className="text-xs">
            Weekly Compliance
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {performanceStats.map((rep) => (
            <div 
              key={rep.repName} 
              className={cn(
                "p-4 rounded-lg border transition-all duration-200",
                "bg-gray-900/50 border-gray-700",
                "hover:bg-gray-900/70 hover:border-gray-600"
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white">{rep.repName}</h3>
                <div className="flex items-center gap-2">
                  {rep.mondayUpdateRate >= 90 && rep.tuesdayCallRate >= 90 && (
                    <Badge variant="success" className="text-xs">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Excellent
                    </Badge>
                  )}
                  {(rep.mondayUpdateRate < 70 || rep.tuesdayCallRate < 70) && (
                    <Badge variant="warning" className="text-xs">
                      <ExclamationCircleIcon className="h-3 w-3 mr-1" />
                      Needs Attention
                    </Badge>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Monday Updates</p>
                    {rep.currentStreak.mondayUpdates >= 3 && (
                      <span className="text-sm">{getStreakIcon(rep.currentStreak.mondayUpdates)}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className={cn(
                        "text-2xl font-bold",
                        getPerformanceColor(rep.mondayUpdateRate)
                      )}>
                        {rep.mondayUpdateRate.toFixed(0)}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {rep.mondayUpdatesSubmitted}/{rep.totalWeeks}
                      </span>
                    </div>
                    <Progress 
                      value={rep.mondayUpdateRate} 
                      className="h-1.5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Tuesday Calls</p>
                    {rep.currentStreak.tuesdayCall >= 3 && (
                      <span className="text-sm">{getStreakIcon(rep.currentStreak.tuesdayCall)}</span>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className={cn(
                        "text-2xl font-bold",
                        getPerformanceColor(rep.tuesdayCallRate)
                      )}>
                        {rep.tuesdayCallRate.toFixed(0)}%
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {rep.tuesdayCallsAttended}/{rep.totalWeeks}
                      </span>
                    </div>
                    <Progress 
                      value={rep.tuesdayCallRate} 
                      className="h-1.5"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
                <div className="flex items-center gap-4">
                  <div className="text-xs text-muted-foreground">
                    Last 4 weeks:
                    <span className="ml-1 text-white font-medium">
                      {rep.lastFourWeeks.mondayUpdates}/4 updates
                    </span>
                    <span className="mx-1">•</span>
                    <span className="text-white font-medium">
                      {rep.lastFourWeeks.tuesdayCalls}/4 calls
                    </span>
                  </div>
                </div>
                
                {(rep.currentStreak.mondayUpdates >= 3 || rep.currentStreak.tuesdayCall >= 3) && (
                  <Badge variant="success" className="text-xs">
                    <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
                    On streak!
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {performanceStats.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No performance data available yet.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Start tracking rep performance to see stats here.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}