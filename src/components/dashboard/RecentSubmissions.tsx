'use client';

import Link from 'next/link';
import { Submission } from '@/types/submission';
import { formatRelativeTime } from '@/utils/date-formatter';

interface RecentSubmissionsProps {
  submissions: Submission[];
  isLoading?: boolean;
}

export default function RecentSubmissions({ 
  submissions, 
  isLoading = false 
}: RecentSubmissionsProps) {
  if (isLoading) {
    return (
      <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-medium text-white mb-4">Recent Submissions</h3>
        <div className="animate-pulse">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="py-3 border-b border-flash-dark-2">
              <div className="bg-flash-dark-2 h-5 w-3/4 rounded"></div>
              <div className="bg-flash-dark-2 h-4 w-1/3 rounded mt-2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!submissions.length) {
    return (
      <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
        <h3 className="text-lg font-medium text-white mb-4">Recent Submissions</h3>
        <p className="text-gray-400 py-3">No submissions yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-white">Recent Submissions</h3>
        <Link 
          href="/dashboard/submissions" 
          className="text-flash-green hover:text-flash-green-light text-sm font-medium"
        >
          View all
        </Link>
      </div>

      <div className="space-y-1">
        {submissions.slice(0, 5).map((submission) => (
          <Link
            key={submission.id}
            href={`/dashboard/submissions/${submission.id}`}
            className="block py-3 px-2 hover:bg-flash-dark-2 rounded-md transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium text-white">{submission.ownerName}</h4>
                <p className="text-sm text-gray-400">
                  Interest: {submission.interestLevel}/5
                  {submission.signedUp && (
                    <span className="text-flash-green ml-2">• Signed Up</span>
                  )}
                </p>
              </div>
              <div className="text-sm text-gray-400">
                {formatRelativeTime(submission.timestamp)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}