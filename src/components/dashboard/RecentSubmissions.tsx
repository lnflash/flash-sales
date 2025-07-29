'use client';

import Link from 'next/link';
import { Submission } from '@/types/submission';
import { formatRelativeTime } from '@/utils/date-formatter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRightIcon, StarIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';

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
      <Card className="bg-white border-light-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-light-text-primary">Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="p-3 rounded-lg bg-light-bg-secondary">
                <div className="bg-light-border h-5 w-3/4 rounded mb-2"></div>
                <div className="bg-light-border h-4 w-1/3 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!submissions.length) {
    return (
      <Card className="bg-white border-light-border">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold text-light-text-primary">Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-light-text-secondary text-center py-8">
            No submissions yet. They'll appear here as they come in.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-light-border hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-light-text-primary">Recent Submissions</CardTitle>
          <Link href="/dashboard/submissions" passHref>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-light-text-secondary hover:text-flash-green hover:bg-light-bg-secondary"
            >
              View all
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {submissions.map((submission) => (
            <Link 
              key={submission.id} 
              href={`/dashboard/submissions/${submission.id}`}
              className="block"
            >
              <div className="p-3 rounded-lg border border-transparent hover:border-light-border hover:bg-light-bg-secondary transition-all duration-200 cursor-pointer group">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-light-text-primary truncate group-hover:text-flash-green transition-colors">
                        {submission.ownerName}
                      </p>
                      {submission.interestLevel && submission.interestLevel >= 8 && (
                        <div className="flex items-center">
                          {[...Array(Math.floor(submission.interestLevel / 2))].map((_, i) => (
                            <StarIcon 
                              key={i} 
                              className="h-3 w-3 text-yellow-500 fill-yellow-500" 
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-light-text-secondary truncate">
                      {submission.phoneNumber || 'No phone'}
                    </p>
                    {submission.territory && (
                      <p className="text-xs text-light-text-tertiary">
                        {submission.territory}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4">
                    <Badge 
                      variant={submission.signedUp ? 'default' : 'secondary'}
                      className={cn(
                        "text-xs",
                        submission.signedUp 
                          ? 'bg-green-100 text-green-800 border-green-200' 
                          : 'bg-gray-100 text-gray-600 border-gray-200'
                      )}
                    >
                      {submission.signedUp ? 'Signed Up' : 'Pending'}
                    </Badge>
                    <span className="text-xs text-light-text-tertiary">
                      {formatRelativeTime(submission.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}