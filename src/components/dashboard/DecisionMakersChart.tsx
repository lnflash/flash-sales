'use client';

import { useState } from 'react';
import {
  UsersIcon,
  ArrowPathIcon,
  UserIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

interface DecisionMakerStat {
  type: string;
  count: number;
  conversions: number;
  conversionRate: number;
}

interface DecisionMakersChartProps {
  data: DecisionMakerStat[];
  isLoading?: boolean;
}

export default function DecisionMakersChart({ data, isLoading = false }: DecisionMakersChartProps) {
  // Icons for each decision maker type
  const getIconForType = (type: string) => {
    switch (type) {
      case 'Owner Only':
        return <UserIcon className="h-5 w-5 text-flash-green" />;
      case 'Multiple Decision Makers':
        return <UserGroupIcon className="h-5 w-5 text-flash-yellow" />;
      case 'Committee':
        return <UsersIcon className="h-5 w-5 text-blue-500" />;
      default:
        return <UserIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  // Colors for each decision maker type
  const getColorForType = (type: string) => {
    switch (type) {
      case 'Owner Only':
        return 'bg-flash-green';
      case 'Multiple Decision Makers':
        return 'bg-flash-yellow';
      case 'Committee':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <ArrowPathIcon className="h-8 w-8 text-gray-500 animate-spin" />
        <p className="mt-2 text-sm text-gray-500">Loading data...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center">
        <p className="text-gray-500">No data available</p>
      </div>
    );
  }

  // Total for percentage calculations
  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="h-full">
      <div className="space-y-6">
        {/* Legend at the top */}
        <div className="flex flex-wrap gap-4 justify-center">
          {data.map((item) => (
            <div key={item.type} className="flex items-center">
              <div className={`h-3 w-3 rounded-full mr-2 ${getColorForType(item.type)}`}></div>
              <span className="text-xs text-gray-400">{item.type}</span>
            </div>
          ))}
        </div>

        {/* Main chart - show stats in a vertical layout */}
        <div className="grid grid-cols-1 gap-4">
          {data.map((item) => (
            <div key={item.type} className="bg-flash-dark-2 rounded-lg p-4">
              <div className="flex items-center mb-2">
                {getIconForType(item.type)}
                <span className="ml-2 font-medium text-white">{item.type}</span>
              </div>
              
              <div className="mt-1 grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-gray-400">Count</p>
                  <p className="text-lg font-medium text-white">{item.count}</p>
                  <p className="text-xs text-gray-500">{((item.count / total) * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Conversions</p>
                  <p className="text-lg font-medium text-flash-green">{item.conversions}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Conv. Rate</p>
                  <p className="text-lg font-medium text-flash-yellow">{item.conversionRate.toFixed(1)}%</p>
                </div>
              </div>
              
              {/* Conversion rate progress bar */}
              <div className="mt-2">
                <div className="w-full bg-flash-dark-3 rounded-full h-2">
                  <div 
                    className={`${getColorForType(item.type)} h-2 rounded-full`} 
                    style={{ width: `${Math.min(100, item.conversionRate)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}