'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Submission } from '@/types/submission';
import { formatRelativeTime } from '@/utils/date-formatter';
import { VirtualList } from '@/components/ui/virtual-list';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { 
  PhoneIcon, 
  StarIcon,
  ChevronRightIcon 
} from '@heroicons/react/24/outline';

interface VirtualSubmissionsTableProps {
  submissions: Submission[];
  isLoading?: boolean;
  height?: number;
}

const ROW_HEIGHT = 80; // Fixed row height for better performance

export function VirtualSubmissionsTable({ 
  submissions, 
  isLoading = false,
  height = 600 
}: VirtualSubmissionsTableProps) {
  
  // Memoize sorted submissions
  const sortedSubmissions = useMemo(() => {
    return [...submissions].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [submissions]);

  const renderRow = (submission: Submission, index: number) => (
    <Link 
      href={`/dashboard/submissions/${submission.id}`}
      className="block h-full"
    >
      <div className={cn(
        "h-full px-4 py-3 border-b border-light-border hover:bg-light-bg-secondary transition-colors cursor-pointer",
        index === 0 && "border-t"
      )}>
        <div className="flex items-center justify-between h-full">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-medium text-light-text-primary truncate">
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
            <div className="flex items-center gap-4 text-sm text-light-text-secondary">
              <span className="flex items-center">
                <PhoneIcon className="h-3 w-3 mr-1" />
                {submission.phoneNumber || 'No phone'}
              </span>
              {submission.territory && (
                <span>{submission.territory}</span>
              )}
              <span className="text-xs">
                {formatRelativeTime(submission.timestamp)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
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
            <ChevronRightIcon className="h-4 w-4 text-light-text-tertiary" />
          </div>
        </div>
      </div>
    </Link>
  );

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-light-border" style={{ height }}>
        <div className="animate-pulse p-4">
          {[...Array(Math.floor(height / ROW_HEIGHT))].map((_, i) => (
            <div key={i} className="mb-4">
              <div className="h-5 bg-light-bg-tertiary rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-light-bg-tertiary rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!submissions.length) {
    return (
      <div className="bg-white rounded-lg border border-light-border flex items-center justify-center" style={{ height }}>
        <p className="text-light-text-secondary">No submissions found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-light-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-light-border bg-light-bg-secondary">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-light-text-primary">
            All Submissions ({submissions.length})
          </h3>
          <span className="text-sm text-light-text-secondary">
            Virtualized for performance
          </span>
        </div>
      </div>

      {/* Virtual List */}
      <VirtualList
        items={sortedSubmissions}
        height={height}
        itemHeight={ROW_HEIGHT}
        renderItem={renderRow}
        overscan={10}
        className="bg-white"
      />
    </div>
  );
}

// Memoized version for better performance
export const MemoizedVirtualSubmissionsTable = React.memo(VirtualSubmissionsTable);