import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

export const RecentLeadsWidget: React.FC = () => {
  // Mock data
  const recentLeads = [
    {
      id: '1',
      name: 'John Smith',
      company: 'Tech Corp',
      status: 'new',
      value: '$25,000',
      createdAt: '2 hours ago'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      company: 'Design Studio',
      status: 'contacted',
      value: '$15,000',
      createdAt: '4 hours ago'
    },
    {
      id: '3',
      name: 'Mike Chen',
      company: 'StartupXYZ',
      status: 'qualified',
      value: '$45,000',
      createdAt: '6 hours ago'
    },
    {
      id: '4',
      name: 'Emma Wilson',
      company: 'Global Inc',
      status: 'proposal',
      value: '$75,000',
      createdAt: '1 day ago'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'contacted': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'qualified': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'proposal': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto">
        {recentLeads.map((lead) => (
          <div key={lead.id} className="p-3 bg-background rounded-lg border border-border hover:border-muted-foreground transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-foreground">{lead.name}</h4>
                <p className="text-sm text-muted-foreground">{lead.company}</p>
              </div>
              <Badge className={getStatusColor(lead.status)}>
                {lead.status}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{lead.value}</span>
              <span className="text-muted-foreground">{lead.createdAt}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <Link href="/dashboard/leads">
          <Button variant="secondary" size="sm" className="w-full">
            View All Leads
            <ArrowRightIcon className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
};