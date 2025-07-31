import Link from 'next/link';
import { Submission, LeadStatus } from '@/types/submission';
import { formatDate } from '@/utils/date-formatter';
import { ArrowRightIcon } from '@heroicons/react/24/outline';

interface LeadStatusCardProps {
  status: LeadStatus;
  leads: Submission[];
  config: {
    color: string;
    label: string;
    icon: React.ForwardRefExoticComponent<React.SVGProps<SVGSVGElement>>;
  };
}

export default function LeadStatusCard({ status, leads, config }: LeadStatusCardProps) {
  const Icon = config.icon;
  
  // Dynamic color classes based on status
  const getColorClasses = () => {
    switch (config.color) {
      case 'purple':
        return {
          bg: 'bg-purple-50',
          badge: 'bg-purple-100 text-purple-800',
          icon: 'text-purple-600'
        };
      case 'blue':
        return {
          bg: 'bg-blue-50',
          badge: 'bg-blue-100 text-blue-800',
          icon: 'text-blue-600'
        };
      case 'yellow':
        return {
          bg: 'bg-yellow-50',
          badge: 'bg-yellow-100 text-yellow-800',
          icon: 'text-yellow-600'
        };
      case 'gray':
      default:
        return {
          bg: 'bg-gray-50',
          badge: 'bg-gray-100 text-gray-800',
          icon: 'text-gray-600'
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-light-border">
      <div className={`p-4 border-b border-light-border ${colors.bg}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-light-text-primary flex items-center">
            <Icon className={`w-5 h-5 mr-2 ${colors.icon}`} />
            {config.label}
          </h3>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors.badge}`}>
            {leads.length}
          </span>
        </div>
      </div>
      
      <div className="p-4 max-h-96 overflow-y-auto">
        {leads.length > 0 ? (
          <div className="space-y-3">
            {leads.slice(0, 10).map(submission => (
              <div key={submission.id} className="border-b border-light-border pb-3 last:border-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-light-text-primary text-sm">
                      {submission.ownerName}
                    </p>
                    <div className="flex items-center mt-1">
                      <div className="flex items-center">
                        <div className="w-16 bg-light-bg-tertiary rounded-full h-1.5">
                          <div
                            className="bg-gradient-to-r from-flash-green to-flash-yellow h-1.5 rounded-full"
                            style={{ width: `${(submission.interestLevel / 5) * 100}%` }}
                          />
                        </div>
                        <span className="ml-2 text-xs text-light-text-secondary">
                          {submission.interestLevel}/5
                        </span>
                      </div>
                      {submission.packageSeen && (
                        <span className="ml-3 text-xs text-green-600">📦 Seen</span>
                      )}
                    </div>
                    <p className="text-xs text-light-text-tertiary mt-1">
                      {formatDate(submission.timestamp)}
                    </p>
                  </div>
                  <Link
                    href={`/dashboard/submissions/${submission.id}`}
                    className="ml-2 text-flash-green hover:text-flash-green-light"
                  >
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
            {leads.length > 10 && (
              <Link
                href={`/dashboard/submissions?leadStatus=${status}`}
                className="block text-center text-sm text-flash-green hover:text-flash-green-light mt-2"
              >
                View all {leads.length} {config.label.toLowerCase()} leads
              </Link>
            )}
          </div>
        ) : (
          <p className="text-light-text-tertiary text-sm">No leads in this status</p>
        )}
      </div>
    </div>
  );
}