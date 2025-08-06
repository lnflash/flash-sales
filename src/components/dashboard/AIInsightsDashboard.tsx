"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SparklesIcon, LightBulbIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from "@heroicons/react/24/outline";
import { geminiAIService } from "@/services/gemini-ai";
import { Submission } from "@/types/submission";

interface AIInsightsDashboardProps {
  submissions: Submission[];
  conversionRate: number;
  territory?: string;
  className?: string;
}

interface InsightCard {
  type: "opportunity" | "warning" | "trend" | "recommendation";
  title: string;
  description: string;
  actionable?: string;
  priority: "high" | "medium" | "low";
}

export default function AIInsightsDashboard({ submissions, conversionRate, territory, className }: AIInsightsDashboardProps) {
  const [insights, setInsights] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processedInsights, setProcessedInsights] = useState<InsightCard[]>([]);

  useEffect(() => {
    if (!geminiAIService.isAvailable() || submissions.length === 0) {
      return;
    }

    const loadInsights = async () => {
      setIsLoading(true);
      try {
        const aiInsights = await geminiAIService.generateSalesInsights({
          submissions,
          conversionRate,
          pipeline: submissions.filter((sub) => !sub.signedUp),
          territory,
        });

        if (aiInsights) {
          setInsights(aiInsights);
          setProcessedInsights(processInsights(aiInsights));
        }
      } catch (error) {
        console.warn("Failed to load AI insights:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadInsights();
  }, [submissions, conversionRate, territory]);

  const processInsights = (rawInsights: string[]): InsightCard[] => {
    return rawInsights.map((insight, index) => {
      const lowerInsight = insight.toLowerCase();

      let type: InsightCard["type"] = "recommendation";
      let priority: InsightCard["priority"] = "medium";

      // Determine insight type based on content
      if (lowerInsight.includes("opportunity") || lowerInsight.includes("potential") || lowerInsight.includes("growth")) {
        type = "opportunity";
        priority = "high";
      } else if (lowerInsight.includes("warning") || lowerInsight.includes("risk") || lowerInsight.includes("decline")) {
        type = "warning";
        priority = "high";
      } else if (lowerInsight.includes("trend") || lowerInsight.includes("increasing") || lowerInsight.includes("decreasing")) {
        type = "trend";
        priority = "medium";
      }

      // Extract title and description
      const sentences = insight.split(/[.!?]+/);
      const title = sentences[0]?.trim() || `Insight ${index + 1}`;
      const description = sentences.slice(1).join(". ").trim() || insight;

      return {
        type,
        title,
        description: description || insight,
        priority,
      };
    });
  };

  const getInsightIcon = (type: InsightCard["type"]) => {
    switch (type) {
      case "opportunity":
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />;
      case "warning":
        return <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />;
      case "trend":
        return <SparklesIcon className="h-4 w-4 text-blue-500" />;
      default:
        return <LightBulbIcon className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getInsightColor = (type: InsightCard["type"]) => {
    switch (type) {
      case "opportunity":
        return "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20";
      case "warning":
        return "border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20";
      case "trend":
        return "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20";
      default:
        return "border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20";
    }
  };

  if (!geminiAIService.isAvailable()) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-gray-400" />
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">AI Insights</CardTitle>
            <Badge variant="secondary" className="text-xs">
              Unavailable
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">Configure Gemini API key to enable AI-powered insights</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">AI Strategic Insights</CardTitle>
            <Badge variant="secondary" className="text-xs">
              Powered by Gemini
            </Badge>
          </div>
          {isLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-500"></div>}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : processedInsights.length > 0 ? (
          <div className="space-y-3">
            {processedInsights.map((insight, index) => (
              <div key={index} className={`p-3 rounded-lg border ${getInsightColor(insight.type)}`}>
                <div className="flex items-start gap-3">
                  {getInsightIcon(insight.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{insight.title}</h4>
                      <Badge
                        variant={insight.priority === "high" ? "destructive" : insight.priority === "medium" ? "secondary" : "outline"}
                        className="text-xs"
                      >
                        {insight.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <SparklesIcon className="h-8 w-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">AI insights will appear when sufficient data is available</p>
          </div>
        )}

        {!isLoading && submissions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Analyzed {submissions.length} submissions</span>
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
