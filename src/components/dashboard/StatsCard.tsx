'use client';

import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/solid';

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
    green: 'bg-green-50 text-flash-green border-green-100',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
  };

  const iconColorClasses = {
    green: 'text-flash-green',
    yellow: 'text-yellow-600',
    blue: 'text-blue-600',
    purple: 'text-purple-600',
  };

  return (
    <Card className="bg-white border-light-border hover:shadow-lg transition-all duration-200 group">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-light-text-secondary">
              {title}
            </p>
            <div className="flex items-baseline mt-2">
              <p className="text-3xl font-semibold text-light-text-primary">
                {value}
              </p>
              {subtitle && (
                <span className="ml-1 text-lg text-light-text-secondary">
                  {subtitle}
                </span>
              )}
            </div>
            
            {change && (
              <div className="flex items-center mt-3 space-x-1">
                {change.positive ? (
                  <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                )}
                <span 
                  className={cn(
                    "text-sm font-semibold",
                    change.positive ? 'text-green-600' : 'text-red-600'
                  )}
                >
                  {change.positive ? '+' : ''}{change.value}%
                </span>
                <span className="text-xs text-light-text-tertiary">
                  vs last month
                </span>
              </div>
            )}
          </div>
          
          <div className={cn(
            "p-3 rounded-lg border transition-all duration-200",
            colorClasses[color],
            "group-hover:scale-105"
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