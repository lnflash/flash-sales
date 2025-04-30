'use client';

import { 
  ArrowPathIcon,
  CreditCardIcon,
  ShoppingCartIcon,
  AcademicCapIcon,
  WrenchIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  GlobeAltIcon,
  LifebuoyIcon
} from '@heroicons/react/24/outline';

interface CommonNeed {
  need: string;
  count: number;
  percentage: number;
}

interface CommonNeedsChartProps {
  data: CommonNeed[];
  isLoading?: boolean;
}

export default function CommonNeedsChart({ data, isLoading = false }: CommonNeedsChartProps) {
  // Get appropriate icon for each need
  const getIconForNeed = (need: string) => {
    switch (need) {
      case 'Payment Processing':
        return <CreditCardIcon className="h-5 w-5 text-flash-green" />;
      case 'POS Integration':
        return <ShoppingCartIcon className="h-5 w-5 text-yellow-500" />;
      case 'Staff Training':
        return <AcademicCapIcon className="h-5 w-5 text-blue-500" />;
      case 'Software Integration':
        return <WrenchIcon className="h-5 w-5 text-purple-500" />;
      case 'Instant Settlement':
        return <ClockIcon className="h-5 w-5 text-red-500" />;
      case 'Mobile App':
        return <DevicePhoneMobileIcon className="h-5 w-5 text-green-500" />;
      case 'Online Payments':
        return <GlobeAltIcon className="h-5 w-5 text-indigo-500" />;
      case 'Customer Support':
        return <LifebuoyIcon className="h-5 w-5 text-pink-500" />;
      default:
        return <WrenchIcon className="h-5 w-5 text-gray-500" />;
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

  // Sort by percentage
  const sortedData = [...data].sort((a, b) => b.percentage - a.percentage);

  return (
    <div className="h-full">
      <div className="space-y-4">
        {sortedData.map((item) => (
          <div key={item.need} className="relative">
            <div className="flex justify-between mb-1">
              <div className="flex items-center">
                {getIconForNeed(item.need)}
                <span className="text-sm text-gray-400 ml-2">{item.need}</span>
              </div>
              <span className="text-sm text-gray-400">{item.percentage.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-flash-dark-2 rounded-full h-2">
              <div 
                className="bg-flash-green h-2 rounded-full" 
                style={{ width: `${item.percentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-right">
              Mentioned {item.count} times
            </div>
          </div>
        ))}

        {/* If we have less than 5 items, add some empty space */}
        {data.length < 5 && (
          <div className="h-16"></div>
        )}
      </div>
    </div>
  );
}