import React from 'react';
import { 
  UsersIcon, 
  CurrencyDollarIcon, 
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

export const StatsOverviewWidget: React.FC = () => {
  // Mock data - in real app would come from API/store
  const stats = [
    {
      label: 'Total Leads',
      value: '2,543',
      change: '+12%',
      trend: 'up',
      icon: UsersIcon,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      label: 'Revenue',
      value: '$143,201',
      change: '+23%',
      trend: 'up',
      icon: CurrencyDollarIcon,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      label: 'Conversion Rate',
      value: '32.5%',
      change: '-2.1%',
      trend: 'down',
      icon: ChartBarIcon,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    }
  ];

  return (
    <div className="h-full flex items-center">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? ArrowTrendingUpIcon : ArrowTrendingDownIcon;
          
          return (
            <div key={index} className="bg-background p-4 rounded-lg border border-border">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                }`}>
                  <TrendIcon className="h-4 w-4" />
                  {stat.change}
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};