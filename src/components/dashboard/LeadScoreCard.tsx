import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  ChartBarIcon, 
  UserGroupIcon, 
  CursorArrowRaysIcon,
  TrophyIcon 
} from '@heroicons/react/24/outline';

interface LeadScoreProps {
  score: number;
  breakdown: {
    demographic: number;
    firmographic: number;
    behavioral: number;
  };
  trend: 'up' | 'down' | 'stable';
  lastUpdated?: string;
}

export function LeadScoreCard({ score, breakdown, trend, lastUpdated }: LeadScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Hot Lead';
    if (score >= 60) return 'Warm Lead';
    if (score >= 40) return 'Cool Lead';
    return 'Cold Lead';
  };

  const getScoreBadgeVariant = (score: number): "success" | "warning" | "destructive" | "secondary" => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    if (score >= 40) return 'secondary';
    return 'destructive';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '→';
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-500';
    if (trend === 'down') return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">Lead Score</CardTitle>
          <Badge variant={getScoreBadgeVariant(score)}>
            {getScoreLabel(score)}
          </Badge>
        </div>
        {lastUpdated && (
          <CardDescription>
            Last updated: {new Date(lastUpdated).toLocaleDateString()}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Main Score Display */}
          <div className="flex items-center justify-center py-4">
            <div className="relative">
              <div className={cn(
                "text-5xl font-bold transition-colors",
                getScoreColor(score)
              )}>
                {score}
              </div>
              <div className={cn(
                "absolute -right-6 top-0 text-2xl",
                getTrendColor()
              )}>
                {getTrendIcon()}
              </div>
            </div>
            <div className="ml-4 text-2xl text-gray-400">/100</div>
          </div>

          {/* Score Breakdown */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-400 mb-2">Score Breakdown</div>
            
            {/* Demographic Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="h-4 w-4 text-blue-500" />
                <span className="text-sm">Demographic</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${breakdown.demographic}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-10 text-right">
                  {breakdown.demographic}%
                </span>
              </div>
            </div>

            {/* Firmographic Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ChartBarIcon className="h-4 w-4 text-purple-500" />
                <span className="text-sm">Firmographic</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all"
                    style={{ width: `${breakdown.firmographic}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-10 text-right">
                  {breakdown.firmographic}%
                </span>
              </div>
            </div>

            {/* Behavioral Score */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CursorArrowRaysIcon className="h-4 w-4 text-green-500" />
                <span className="text-sm">Behavioral</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-24 bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${breakdown.behavioral}%` }}
                  />
                </div>
                <span className="text-sm font-medium w-10 text-right">
                  {breakdown.behavioral}%
                </span>
              </div>
            </div>
          </div>

          {/* Score Insights */}
          <div className="pt-3 border-t border-gray-700">
            <div className="flex items-center space-x-2 text-sm">
              <TrophyIcon className="h-4 w-4 text-yellow-500" />
              <span className="text-gray-400">
                {score >= 80 && "Ready for immediate outreach"}
                {score >= 60 && score < 80 && "Nurture with targeted content"}
                {score >= 40 && score < 60 && "Requires qualification"}
                {score < 40 && "Needs more engagement"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}