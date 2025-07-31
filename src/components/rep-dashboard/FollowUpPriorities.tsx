import Link from 'next/link';
import { Submission } from '@/types/submission';
import { 
  ClockIcon,
  MapPinIcon,
  PhoneIcon,
  CalendarIcon,
  ArrowRightIcon 
} from '@heroicons/react/24/outline';

interface FollowUpPrioritiesProps {
  followUps: Array<{
    submission: Submission;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    daysSince: number;
  }>;
}

export default function FollowUpPriorities({ followUps }: FollowUpPrioritiesProps) {
  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'medium':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-light-border">
      <h2 className="text-lg font-semibold text-light-text-primary mb-4 flex items-center">
        <ClockIcon className="w-5 h-5 mr-2 text-flash-green" />
        Today's Priority Follow-ups
      </h2>
      
      {followUps.length > 0 ? (
        <div className="space-y-3">
          {followUps.map(({ submission, priority, daysSince }) => (
            <div 
              key={submission.id} 
              className="flex items-center justify-between p-3 bg-light-bg-secondary rounded-lg hover:bg-light-bg-tertiary transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center">
                  <p className="font-medium text-light-text-primary">
                    {submission.ownerName}
                  </p>
                  <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityStyles(priority)}`}>
                    {priority}
                  </span>
                  {submission.interestLevel >= 4 && (
                    <span className="ml-2 text-xs">🔥 Hot Lead</span>
                  )}
                </div>
                <div className="flex items-center mt-1 text-sm text-light-text-secondary">
                  <MapPinIcon className="w-4 h-4 mr-1" />
                  {submission.territory || 'N/A'}
                  {submission.phoneNumber && (
                    <>
                      <span className="mx-2">•</span>
                      <PhoneIcon className="w-4 h-4 mr-1" />
                      {submission.phoneNumber}
                    </>
                  )}
                  <span className="mx-2">•</span>
                  <CalendarIcon className="w-4 h-4 mr-1" />
                  {daysSince} {daysSince === 1 ? 'day' : 'days'} ago
                </div>
                {submission.specificNeeds && (
                  <p className="text-xs text-light-text-tertiary mt-1 line-clamp-1">
                    Note: {submission.specificNeeds}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {submission.phoneNumber && (
                  <a
                    href={`tel:${submission.phoneNumber}`}
                    className="p-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition-colors"
                    title="Call now"
                  >
                    <PhoneIcon className="w-4 h-4" />
                  </a>
                )}
                <Link
                  href={`/dashboard/submissions/${submission.id}`}
                  className="px-3 py-1 bg-flash-green text-white rounded-md hover:bg-flash-green-light transition-colors flex items-center text-sm"
                >
                  View
                  <ArrowRightIcon className="w-3 h-3 ml-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-light-text-secondary mb-2">No urgent follow-ups for today! 🎉</p>
          <p className="text-sm text-light-text-tertiary">
            Keep up the great work staying on top of your leads.
          </p>
        </div>
      )}
    </div>
  );
}