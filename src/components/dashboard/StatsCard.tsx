'use client';

import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
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
  change, 
  color = 'green' 
}: StatsCardProps) {
  const colorClasses = {
    green: 'bg-flash-green/10 text-flash-green',
    yellow: 'bg-flash-yellow/10 text-flash-yellow',
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-400 text-sm font-medium">{title}</p>
          <p className="text-white text-2xl font-bold mt-1">{value}</p>
          
          {change && (
            <div className="flex items-center mt-2">
              <span 
                className={`text-sm font-medium ${
                  change.positive ? 'text-flash-green' : 'text-red-500'
                }`}
              >
                {change.positive ? '+' : ''}{change.value}%
              </span>
              <span className="text-gray-400 text-xs ml-1">vs last month</span>
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}