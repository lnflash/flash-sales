import React from 'react';
import { 
  PhoneIcon, 
  EnvelopeIcon, 
  DocumentTextIcon,
  UserPlusIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export const ActivityFeedWidget: React.FC = () => {
  const activities = [
    {
      id: '1',
      type: 'call',
      message: 'Called John Smith',
      user: 'Sarah Lee',
      time: '10 min ago',
      icon: PhoneIcon,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      id: '2',
      type: 'email',
      message: 'Sent proposal to Tech Corp',
      user: 'Mike Chen',
      time: '25 min ago',
      icon: EnvelopeIcon,
      color: 'text-purple-600 dark:text-purple-400'
    },
    {
      id: '3',
      type: 'lead',
      message: 'New lead from website',
      user: 'System',
      time: '1 hour ago',
      icon: UserPlusIcon,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      id: '4',
      type: 'deal',
      message: 'Closed deal with StartupXYZ',
      user: 'Emma Wilson',
      time: '2 hours ago',
      icon: CheckCircleIcon,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      id: '5',
      type: 'document',
      message: 'Updated contract terms',
      user: 'John Doe',
      time: '3 hours ago',
      icon: DocumentTextIcon,
      color: 'text-orange-600 dark:text-orange-400'
    }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto">
        {activities.map((activity) => {
          const Icon = activity.icon;
          
          return (
            <div key={activity.id} className="flex items-start gap-3 p-2 hover:bg-muted/50 rounded-lg transition-colors">
              <div className={`p-2 rounded-lg bg-muted ${activity.color}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {activity.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activity.user} · {activity.time}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};