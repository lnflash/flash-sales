import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ChartBarIcon,
  UserGroupIcon,
  CursorArrowRaysIcon,
  TrophyIcon,
  SparklesIcon,
  ClockIcon,
  CurrencyDollarIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";

interface AILeadScoreProps {
  score: number;
  confidence: number;
  factors: {
    name: string;
    impact: number;
    value: any;
  }[];
  predictedOutcome: {
    probability: number;
    timeToClose: number;
    expectedValue: number;
  };
  recommendations: string[];
  historicalComparison: {
    similarLeadsCount: number;
    averageConversionRate: number;
    averageTimeToClose: number;
  };
  breakdown: {
    demographic: number;
    firmographic: number;
    behavioral: number;
  };
  trend: "up" | "down" | "stable";
  lastUpdated?: string;
}

export function AILeadScoreCard({
  score,
  confidence,
  factors,
  predictedOutcome,
  recommendations,
  historicalComparison,
  breakdown,
  trend,
  lastUpdated,
}: AILeadScoreProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Hot Lead";
    if (score >= 60) return "Warm Lead";
    if (score >= 40) return "Cool Lead";
    return "Cold Lead";
  };

  const getScoreBadgeVariant = (score: number): "success" | "warning" | "destructive" | "secondary" => {
    if (score >= 80) return "success";
    if (score >= 60) return "warning";
    if (score >= 40) return "secondary";
    return "destructive";
  };

  const getTrendIcon = () => {
    if (trend === "up") return "↑";
    if (trend === "down") return "↓";
    return "→";
  };

  const getTrendColor = () => {
    if (trend === "up") return "text-green-500";
    if (trend === "down") return "text-red-500";
    return "text-gray-500";
  };

  const getProbabilityColor = (probability: number) => {
    if (probability >= 0.7) return "text-green-500";
    if (probability >= 0.4) return "text-yellow-500";
    return "text-orange-500";
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg font-medium">AI Lead Score</CardTitle>
            <SparklesIcon className="h-5 w-5 text-purple-500" />
          </div>
          <Badge variant={getScoreBadgeVariant(score)}>{getScoreLabel(score)}</Badge>
        </div>
        {lastUpdated && <CardDescription>Last analyzed: {new Date(lastUpdated).toLocaleDateString()}</CardDescription>}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="score" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-100 dark:bg-gray-800">
            <TabsTrigger value="score" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
              Score
            </TabsTrigger>
            <TabsTrigger value="prediction" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
              Prediction
            </TabsTrigger>
            <TabsTrigger value="factors" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
              Factors
            </TabsTrigger>
            <TabsTrigger value="actions" className="data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700">
              Actions
            </TabsTrigger>
          </TabsList>

          {/* Score Tab */}
          <TabsContent value="score" className="space-y-4">
            {/* Main Score Display */}
            <div className="flex items-center justify-center py-4">
              <div className="relative">
                <div className={cn("text-5xl font-bold transition-colors", getScoreColor(score))}>{score}</div>
                <div className={cn("absolute -right-6 top-0 text-2xl", getTrendColor())}>{getTrendIcon()}</div>
              </div>
              <div className="ml-4 text-2xl text-gray-400">/100</div>
            </div>

            {/* Confidence Indicator */}
            <div className="flex items-center justify-center space-x-2">
              <InformationCircleIcon className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-gray-400">{confidence}% confidence</span>
              <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${confidence}%` }} />
              </div>
            </div>

            {/* Score Breakdown */}
            <div className="space-y-3">
              <div className="text-sm font-medium text-gray-400 mb-2">Score Breakdown</div>

              {/* Demographic Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserGroupIcon className="h-4 w-4 text-blue-500" />
                  <span className="text-sm">Demographic</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${breakdown.demographic}%` }} />
                  </div>
                  <span className="text-sm font-medium w-10 text-right">{breakdown.demographic}%</span>
                </div>
              </div>

              {/* Firmographic Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ChartBarIcon className="h-4 w-4 text-purple-500" />
                  <span className="text-sm">Firmographic</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${breakdown.firmographic}%` }} />
                  </div>
                  <span className="text-sm font-medium w-10 text-right">{breakdown.firmographic}%</span>
                </div>
              </div>

              {/* Behavioral Score */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CursorArrowRaysIcon className="h-4 w-4 text-green-500" />
                  <span className="text-sm">Behavioral</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{ width: `${breakdown.behavioral}%` }} />
                  </div>
                  <span className="text-sm font-medium w-10 text-right">{breakdown.behavioral}%</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Prediction Tab */}
          <TabsContent value="prediction" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Win Probability */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Win Probability</span>
                  <TrophyIcon className="h-4 w-4 text-yellow-500" />
                </div>
                <div className={cn("text-2xl font-bold", getProbabilityColor(predictedOutcome.probability))}>
                  {(predictedOutcome.probability * 100).toFixed(0)}%
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all",
                      predictedOutcome.probability >= 0.7 ? "bg-green-500" : predictedOutcome.probability >= 0.4 ? "bg-yellow-500" : "bg-orange-500"
                    )}
                    style={{ width: `${predictedOutcome.probability * 100}%` }}
                  />
                </div>
              </div>

              {/* Time to Close */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Est. Time to Close</span>
                  <ClockIcon className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-blue-400">{predictedOutcome.timeToClose} days</div>
                <p className="text-xs text-gray-500 mt-1">Average: {historicalComparison.averageTimeToClose} days</p>
              </div>

              {/* Expected Value */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Expected Value</span>
                  <CurrencyDollarIcon className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-400">${predictedOutcome.expectedValue.toLocaleString()}</div>
                <p className="text-xs text-gray-500 mt-1">Based on {historicalComparison.similarLeadsCount} similar leads</p>
              </div>
            </div>

            {/* Historical Comparison */}
            <div className="pt-3 border-t border-gray-700">
              <div className="flex items-center space-x-2 mb-2">
                <ArrowTrendingUpIcon className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-gray-400">Historical Performance</span>
              </div>
              <div className="text-xs space-y-1">
                <p className="text-gray-500">Similar leads convert at {historicalComparison.averageConversionRate}% rate</p>
                <p className="text-gray-500">Based on {historicalComparison.similarLeadsCount} comparable opportunities</p>
              </div>
            </div>
          </TabsContent>

          {/* Factors Tab */}
          <TabsContent value="factors" className="space-y-3">
            <div className="text-sm font-medium text-gray-400 mb-2">Key Influence Factors</div>
            {factors.map((factor, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                <div className="flex-1">
                  <p className="text-sm font-medium">{factor.name}</p>
                  <p className="text-xs text-gray-500">{factor.value}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={cn(
                        "h-2 rounded-full transition-all",
                        factor.impact >= 0.8 ? "bg-green-500" : factor.impact >= 0.5 ? "bg-yellow-500" : "bg-orange-500"
                      )}
                      style={{ width: `${factor.impact * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-400 w-8 text-right">{(factor.impact * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-3">
            <div className="flex items-center space-x-2 mb-3">
              <LightBulbIcon className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-400">AI Recommendations</span>
            </div>
            <div className="space-y-2">
              {recommendations.map((recommendation, index) => (
                <div key={index} className="p-3 bg-gray-800 rounded-lg text-sm hover:bg-gray-750 transition-colors">
                  {recommendation}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
