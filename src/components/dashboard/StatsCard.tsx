'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUpIcon, TrendingDownIcon } from '@heroicons/react/24/solid';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  subtitle?: string;
  change?: {
    value: number;
    positive: boolean;
  };
  color?: 'green' | 'yellow' | 'blue' | 'purple';
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  subtitle,
  change, 
  color = 'green' 
}: StatsCardProps) {
  const colorClasses = {
    green: 'bg-flash-green/10 text-flash-green border-flash-green/20',
    yellow: 'bg-flash-yellow/10 text-flash-yellow border-flash-yellow/20',
    blue: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    purple: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  };

  const iconColorClasses = {
    green: 'text-flash-green',
    yellow: 'text-flash-yellow',
    blue: 'text-blue-500',
    purple: 'text-purple-500',
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/70 transition-all duration-200 hover:shadow-xl hover:shadow-black/20 group">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground group-hover:text-gray-300 transition-colors">
              {title}
            </p>
            <div className="flex items-baseline mt-2">
              <p className="text-3xl font-bold text-white">
                {value}
              </p>
              {subtitle && (
                <span className="ml-1 text-lg text-muted-foreground">
                  {subtitle}
                </span>
              )}
            </div>
            
            {change && (
              <div className="flex items-center mt-3 space-x-1">
                {change.positive ? (
                  <TrendingUpIcon className="h-4 w-4 text-flash-green" />
                ) : (
                  <TrendingDownIcon className="h-4 w-4 text-red-500" />
                )}
                <span 
                  className={cn(
                    "text-sm font-semibold",
                    change.positive ? 'text-flash-green' : 'text-red-500'
                  )}
                >
                  {change.positive ? '+' : ''}{change.value}%
                </span>
                <span className="text-xs text-muted-foreground">
                  vs last month
                </span>
              </div>
            )}
          </div>
          
          <div className={cn(
            "p-3 rounded-full border transition-all duration-200",
            colorClasses[color],
            "group-hover:scale-110"
          )}>
            <div className={iconColorClasses[color]}>
              {icon}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}