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
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg">Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="p-3 rounded-lg bg-gray-700/50">
                <div className="bg-gray-600 h-5 w-3/4 rounded mb-2"></div>
                <div className="bg-gray-600 h-4 w-1/3 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!submissions.length) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg">Recent Submissions</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No submissions yet. They'll appear here as they come in.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getInterestBadgeVariant = (level: number): "success" | "warning" | "secondary" | "destructive" => {
    if (level >= 8) return 'success';
    if (level >= 6) return 'warning';
    if (level >= 4) return 'secondary';
    return 'destructive';
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Recent Submissions</CardTitle>
        <Button 
          variant="ghost" 
          size="sm"
          asChild
        >
          <Link href="/dashboard/submissions" className="flex items-center space-x-1">
            <span>View all</span>
            <ArrowRightIcon className="h-4 w-4" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {submissions.slice(0, 5).map((submission) => (
            <Link
              key={submission.id}
              href={`/dashboard/submissions/${submission.id}`}
              className={cn(
                "block p-3 rounded-lg transition-all duration-200",
                "hover:bg-gray-700/50 hover:shadow-md",
                "border border-transparent hover:border-gray-600",
                "group"
              )}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white group-hover:text-flash-green transition-colors truncate">
                    {submission.ownerName}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={cn(
                            "h-3 w-3 transition-colors",
                            i < submission.interestLevel 
                              ? "text-flash-yellow fill-flash-yellow" 
                              : "text-gray-600"
                          )}
                        />
                      ))}
                    </div>
                    {submission.signedUp && (
                      <Badge variant="success" className="text-xs">
                        Signed Up
                      </Badge>
                    )}
                    {submission.packageSeen && (
                      <Badge variant="info" className="text-xs">
                        Package Viewed
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <Badge 
                    variant={getInterestBadgeVariant(submission.interestLevel)}
                    className="mb-1"
                  >
                    {submission.interestLevel}/10
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    {formatRelativeTime(submission.timestamp)}
                  </p>
                </div>
              </div>
              
              {submission.specificNeeds && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                  {submission.specificNeeds}
                </p>
              )}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}