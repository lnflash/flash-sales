"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FireIcon, ArrowRightIcon, TrophyIcon, ClockIcon, PhoneIcon, SparklesIcon } from "@heroicons/react/24/outline";
import { formatRelativeTime } from "@/utils/date-formatter";
import { cn } from "@/lib/utils";
import { useTopScoredLeads } from "@/hooks/useAILeadScoring";
import { Submission } from "@/types/submission";

interface HotLeadsListProps {
  submissions: Submission[];
  isLoading?: boolean;
}

export function HotLeadsList({ submissions, isLoading = false }: HotLeadsListProps) {
  // Simple fallback scoring based on available data
  const getHotLeads = (submissions: Submission[], maxLeads: number = 5) => {
    return submissions
      .filter((sub) => sub.interestLevel && sub.interestLevel >= 7) // High interest only
      .sort((a, b) => {
        // Score based on interest level, revenue, and recency
        const scoreA =
          (a.interestLevel || 0) +
          (a.monthlyRevenue ? getRevenueScore(a.monthlyRevenue) : 0) +
          (a.phoneNumber ? 10 : 0) + // Has phone contact
          (new Date(a.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 10 : 0); // Recent (last 7 days)

        const scoreB =
          (b.interestLevel || 0) +
          (b.monthlyRevenue ? getRevenueScore(b.monthlyRevenue) : 0) +
          (b.phoneNumber ? 10 : 0) +
          (new Date(b.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 10 : 0);

        return scoreB - scoreA;
      })
      .slice(0, maxLeads)
      .map((sub) => ({
        lead: {
          id: String(sub.id),
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
          timestamp: sub.timestamp,
        },
        score: Math.min(100, Math.max(70, (sub.interestLevel || 0) * 10 + (sub.monthlyRevenue ? getRevenueScore(sub.monthlyRevenue) : 0))),
        confidence: 0.8,
        predictedOutcome: {
          probability: ((sub.interestLevel || 0) / 10) * 0.9,
          timeToClose: sub.interestLevel && sub.interestLevel >= 9 ? 7 : 14,
          expectedValue: getRevenueScore(sub.monthlyRevenue || "") * 100,
        },
        recommendations: [`High interest lead (${sub.interestLevel}/10) - Priority contact`],
      }));
  };

  const getRevenueScore = (revenue: string): number => {
    if (!revenue) return 0;
    const cleanRevenue = revenue.toLowerCase().replace(/[^\d]/g, "");
    const amount = parseInt(cleanRevenue) || 0;

    if (amount >= 100000) return 20;
    if (amount >= 50000) return 15;
    if (amount >= 25000) return 10;
    if (amount >= 10000) return 5;
    return 0;
  };

  const hotLeads = getHotLeads(submissions, 5);

  // Try to use AI scoring, but fallback to simple scoring
  const { topLeads: aiLeads, isLoading: isLoadingScores } = useTopScoredLeads(
    submissions.map((sub) => ({
      id: String(sub.id),
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
      interactions: [],
    })),
    5
  );

  // Use AI leads if available, otherwise fallback to simple scoring
  const displayLeads = aiLeads && aiLeads.length > 0 ? aiLeads : hotLeads;

  if (isLoading || isLoadingScores) {
    return (
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Hot Leads</CardTitle>
              <FireIcon className="h-5 w-5 text-red-500" />
            </div>
            <SparklesIcon className="h-5 w-5 text-purple-500 animate-pulse" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="p-3 rounded-lg bg-gray-100 dark:bg-gray-800">
                <div className="bg-gray-200 dark:bg-gray-700 h-5 w-3/4 rounded mb-2"></div>
                <div className="bg-gray-200 dark:bg-gray-700 h-4 w-1/3 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!displayLeads.length) {
    return (
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Hot Leads</CardTitle>
              <FireIcon className="h-5 w-5 text-red-500" />
            </div>
            <SparklesIcon className="h-5 w-5 text-purple-500" />
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-300 text-center py-8">No hot leads identified yet. Looking for high-interest submissions...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Hot Leads</CardTitle>
            <FireIcon className="h-5 w-5 text-red-500" />
          </div>
          <Link href="/dashboard/submissions?filter=hot" passHref>
            <Button variant="ghost" size="sm" className="text-gray-600 dark:text-gray-300 hover:text-flash-green hover:bg-gray-50 dark:hover:bg-gray-800">
              View all hot leads
              <ArrowRightIcon className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {displayLeads.map((item: any, index: number) => (
            <Link key={item.lead.id} href={`/dashboard/submissions/${item.lead.id}`} className="block">
              <div
                className={cn(
                  "p-3 rounded-lg border transition-all duration-200 cursor-pointer group",
                  index === 0
                    ? "border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-700 hover:bg-red-100 dark:hover:bg-red-900/30"
                    : "border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {index === 0 && <TrophyIcon className="h-4 w-4 text-yellow-500" />}
                      <p
                        className={cn(
                          "font-medium truncate group-hover:text-flash-green transition-colors",
                          index === 0 ? "text-red-700 dark:text-red-400" : "text-gray-900 dark:text-white"
                        )}
                      >
                        {item.lead.ownerName}
                      </p>
                      <Badge
                        variant="destructive"
                        className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700"
                      >
                        {item.score}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <p className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                        <PhoneIcon className="h-3 w-3 mr-1" />
                        {item.lead.phoneNumber || "No phone"}
                      </p>
                      {item.predictedOutcome && (
                        <p className="text-sm text-green-600 dark:text-green-400 flex items-center">
                          <TrophyIcon className="h-3 w-3 mr-1" />
                          {(item.predictedOutcome.probability * 100).toFixed(0)}% win
                        </p>
                      )}
                    </div>
                    {item.recommendations && item.recommendations[0] && (
                      <p className={cn("text-xs mt-2 line-clamp-1", index === 0 ? "text-red-600 dark:text-red-400" : "text-gray-500 dark:text-gray-400")}>
                        {item.recommendations[0]}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4">
                    {item.predictedOutcome && (
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                        <ClockIcon className="h-3 w-3 mr-1" />
                        {item.predictedOutcome.timeToClose}d
                      </div>
                    )}
                    <span className="text-xs text-gray-500 dark:text-gray-400">{formatRelativeTime(item.lead.timestamp || new Date().toISOString())}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* AI Insights Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <SparklesIcon className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">AI Lead Intelligence</span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Total leads analyzed</span>
              <span className="font-medium text-gray-900 dark:text-white">{submissions.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">🔥 Hot leads (80+ score)</span>
              <span className="text-flash-green font-medium">{displayLeads.filter((l: any) => l.score >= 80).length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">⚡ High potential (60+ score)</span>
              <span className="text-blue-500 font-medium">{displayLeads.filter((l: any) => l.score >= 60 && l.score < 80).length}</span>
            </div>
            {aiLeads && aiLeads.length > 0 && <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">Enhanced with Gemini AI analysis</div>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
