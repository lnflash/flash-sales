import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  UserPlusIcon, 
  PhoneIcon, 
  DocumentPlusIcon,
  CalendarIcon,
  EnvelopeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export const QuickActionsWidget: React.FC = () => {
  const actions = [
    {
      label: 'Add Lead',
      icon: UserPlusIcon,
      href: '/dashboard/leads?action=new',
      color: 'hover:bg-blue-100 dark:hover:bg-blue-900/20'
    },
    {
      label: 'Log Call',
      icon: PhoneIcon,
      href: '#',
      color: 'hover:bg-green-100 dark:hover:bg-green-900/20'
    },
    {
      label: 'Create Proposal',
      icon: DocumentPlusIcon,
      href: '#',
      color: 'hover:bg-purple-100 dark:hover:bg-purple-900/20'
    },
    {
      label: 'Schedule Meeting',
      icon: CalendarIcon,
      href: '#',
      color: 'hover:bg-orange-100 dark:hover:bg-orange-900/20'
    },
    {
      label: 'Send Email',
      icon: EnvelopeIcon,
      href: '#',
      color: 'hover:bg-pink-100 dark:hover:bg-pink-900/20'
    },
    {
      label: 'View Reports',
      icon: ChartBarIcon,
      href: '/dashboard/analytics',
      color: 'hover:bg-indigo-100 dark:hover:bg-indigo-900/20'
    }
  ];

  return (
    <div className="h-full">
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <Link key={index} href={action.href}>
              <Button
                variant="secondary"
                className={`w-full h-auto flex-col gap-2 p-4 ${action.color}`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm">{action.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
};