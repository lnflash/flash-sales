'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FireIcon, 
  ArrowRightIcon, 
  TrophyIcon,
  ClockIcon,
  PhoneIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { formatRelativeTime } from '@/utils/date-formatter';
import { cn } from '@/lib/utils';
import { useTopScoredLeads } from '@/hooks/useAILeadScoring';
import { Submission } from '@/types/submission';

interface HotLeadsListProps {
  submissions: Submission[];
  isLoading?: boolean;
}

export function HotLeadsList({ submissions, isLoading = false }: HotLeadsListProps) {
  // Prepare lead data for scoring
  const leads = submissions.map(sub => ({
    id: String(sub.id), // Convert to string for consistency
    ownerName: sub.ownerName,
    phoneNumber: sub.phoneNumber,
    email: sub.email,
    interestLevel: sub.interestLevel || 0,
    specificNeeds: sub.specificNeeds,
    territory: sub.territory,
    businessType: sub.businessType,
    monthlyRevenue: sub.monthlyRevenue,
    numberOfEmployees: sub.numberOfEmployees,
    painPoints: sub.painPoints || [],
    interactions: []
  }));

  const { topLeads, isLoading: isLoadingScores } = useTopScoredLeads(leads, 5);

  if (isLoading || isLoadingScores) {
    return (
      <Card className="bg-white border-light-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold text-light-text-primary">
                Hot Leads
              </CardTitle>
              <FireIcon className="h-5 w-5 text-red-500" />
            </div>
            <SparklesIcon className="h-5 w-5 text-purple-500 animate-pulse" />
          </div>
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

  if (!topLeads.length) {
    return (
      <Card className="bg-white border-light-border">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold text-light-text-primary">
                Hot Leads
              </CardTitle>
              <FireIcon className="h-5 w-5 text-red-500" />
            </div>
            <SparklesIcon className="h-5 w-5 text-purple-500" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-light-text-secondary text-center py-8">
            No hot leads identified yet. AI is analyzing submissions...
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-light-border hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold text-light-text-primary">
              Hot Leads
            </CardTitle>
            <FireIcon className="h-5 w-5 text-red-500" />
          </div>
          <Link href="/dashboard/submissions?filter=hot" passHref>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-light-text-secondary hover:text-flash-green hover:bg-light-bg-secondary"
            >
              View all hot leads
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {topLeads.map((item, index) => (
            <Link 
              key={item.lead.id} 
              href={`/dashboard/submissions/${item.lead.id}`}
              className="block"
            >
              <div className={cn(
                "p-3 rounded-lg border transition-all duration-200 cursor-pointer group",
                index === 0 ? 
                  "border-red-300 bg-red-50 hover:bg-red-100" : 
                  "border-transparent hover:border-light-border hover:bg-light-bg-secondary"
              )}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {index === 0 && (
                        <TrophyIcon className="h-4 w-4 text-yellow-500" />
                      )}
                      <p className={cn(
                        "font-medium truncate group-hover:text-flash-green transition-colors",
                        index === 0 ? "text-red-700" : "text-light-text-primary"
                      )}>
                        {item.lead.ownerName}
                      </p>
                      <Badge 
                        variant="destructive"
                        className="text-xs bg-red-100 text-red-800 border-red-200"
                      >
                        {item.score}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm text-light-text-secondary flex items-center">
                        <PhoneIcon className="h-3 w-3 mr-1" />
                        {item.lead.phoneNumber || 'No phone'}
                      </p>
                      {item.predictedOutcome && (
                        <p className="text-sm text-green-600 flex items-center">
                          <TrophyIcon className="h-3 w-3 mr-1" />
                          {(item.predictedOutcome.probability * 100).toFixed(0)}% win
                        </p>
                      )}
                    </div>
                    {item.recommendations && item.recommendations[0] && (
                      <p className={cn(
                        "text-xs mt-2 line-clamp-1",
                        index === 0 ? "text-red-600" : "text-light-text-tertiary"
                      )}>
                        {item.recommendations[0]}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4">
                    {item.predictedOutcome && (
                      <div className="flex items-center text-xs text-light-text-tertiary">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {item.predictedOutcome.timeToClose}d
                      </div>
                    )}
                    <span className="text-xs text-light-text-tertiary">
                      {formatRelativeTime(item.lead.timestamp || new Date().toISOString())}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* AI Insights Summary */}
        <div className="mt-4 pt-4 border-t border-light-border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-light-text-secondary">
              AI analyzed {submissions.length} leads
            </span>
            <span className="text-flash-green font-medium">
              {topLeads.filter(l => l.score >= 80).length} hot leads found
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}