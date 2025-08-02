import React from 'react';
import { TrophyIcon, FireIcon } from '@heroicons/react/24/outline';

export const TeamLeaderboardWidget: React.FC = () => {
  const teamMembers = [
    { name: 'Sarah Lee', deals: 12, revenue: '$145K', trend: '+15%', isTop: true },
    { name: 'Mike Chen', deals: 10, revenue: '$122K', trend: '+8%', isTop: false },
    { name: 'Emma Wilson', deals: 9, revenue: '$98K', trend: '+12%', isTop: false },
    { name: 'John Doe', deals: 8, revenue: '$87K', trend: '-2%', isTop: false },
    { name: 'Lisa Park', deals: 7, revenue: '$76K', trend: '+5%', isTop: false }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto">
        {teamMembers.map((member, index) => (
          <div 
            key={index} 
            className={`p-3 rounded-lg border transition-all ${
              member.isTop 
                ? 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-300 dark:border-yellow-700' 
                : 'bg-background border-border hover:border-muted-foreground'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-sm font-semibold">
                  {index + 1}
                </div>
                <div>
                  <p className="font-medium text-foreground flex items-center gap-2">
                    {member.name}
                    {member.isTop && <TrophyIcon className="h-4 w-4 text-yellow-500" />}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {member.deals} deals · {member.revenue}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${
                  member.trend.startsWith('+') 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {member.trend}
                </p>
                {parseFloat(member.trend) > 10 && (
                  <FireIcon className="h-4 w-4 text-orange-500 ml-auto" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};