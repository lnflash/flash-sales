"use client";

import { useMemo } from "react";
import {
  TrophyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";
import { AdvancedAnalytics } from "@/utils/advanced-analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ExecutiveDashboardProps {
  analytics: AdvancedAnalytics;
  isLoading?: boolean;
}

export default function ExecutiveDashboard({ analytics, isLoading = false }: ExecutiveDashboardProps) {
  const alertsByType = useMemo(() => {
    const alerts = analytics.executiveSummary.alerts;
    return {
      success: alerts.filter((a) => a.type === "success"),
      warning: alerts.filter((a) => a.type === "warning"),
      danger: alerts.filter((a) => a.type === "danger"),
    };
  }, [analytics.executiveSummary.alerts]);

  const getMetricIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case "conversion rate":
        return <ChartBarIcon className="h-5 w-5" />;
      case "pipeline size":
        return <CurrencyDollarIcon className="h-5 w-5" />;
      case "avg. interest":
        return <ArrowTrendingUpIcon className="h-5 w-5" />;
      case "hot prospects":
        return <TrophyIcon className="h-5 w-5" />;
      default:
        return <ChartBarIcon className="h-5 w-5" />;
    }
  };

  const getMetricColor = (trend: number) => {
    if (trend > 0) return "text-green-600 dark:text-green-400";
    if (trend < 0) return "text-red-600 dark:text-red-400";
    return "text-gray-500 dark:text-gray-400";
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <ArrowTrendingUpIcon className="h-4 w-4" />;
    if (trend < 0) return <ArrowTrendingDownIcon className="h-4 w-4" />;
    return <ClockIcon className="h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Loading state */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-1/2 mb-4"></div>
                <div className="h-8 bg-gray-100 dark:bg-gray-800 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <Card key={i} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 bg-gray-100 dark:bg-gray-800 rounded w-1/3 mb-4"></div>
                <div className="h-32 bg-gray-100 dark:bg-gray-800 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Executive KPIs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {analytics.executiveSummary.keyMetrics.map((metric, index) => (
          <Card key={metric.label} className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={cn(
                    "p-2 rounded-lg",
                    index === 0
                      ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400"
                      : index === 1
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400"
                      : index === 2
                      ? "bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400"
                      : "bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400"
                  )}
                >
                  {getMetricIcon(metric.label)}
                </div>
                <div className={`flex items-center text-sm ${getMetricColor(metric.trend)}`}>
                  {getTrendIcon(metric.trend)}
                  <span className="ml-1">
                    {metric.trend > 0 ? "+" : ""}
                    {metric.trend.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{metric.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Executive Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Health */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2 text-flash-green" />
              Pipeline Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Total Pipeline</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{analytics.pipelineHealth.totalPipeline}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Qualified Leads</span>
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">{analytics.pipelineHealth.qualifiedLeads}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Hot Prospects</span>
                  <span className="text-lg font-semibold text-flash-green">{analytics.pipelineHealth.hotProspects}</span>
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <p className="text-xs text-gray-600 dark:text-gray-300">Predicted Conversions</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl font-bold text-gray-900 dark:text-white">{analytics.predictions.nextMonthProjections.expectedConversions}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    / {analytics.predictions.nextMonthProjections.expectedSubmissions} submissions
                  </span>
                </div>
                <Badge variant={analytics.predictions.trend === "increasing" ? "success" : "warning"} className="mt-2">
                  {analytics.predictions.trend} trend
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Velocity */}
        <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-flash-green" />
              Sales Velocity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Avg. Time to Convert</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.salesVelocity.avgTimeToConvert} days</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-300">0-7 days</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{analytics.salesVelocity.velocityByTimeframe["0-7 days"]}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-300">8-30 days</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{analytics.salesVelocity.velocityByTimeframe["8-30 days"]}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-300">31-60 days</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{analytics.salesVelocity.velocityByTimeframe["31-60 days"]}</p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-600 dark:text-gray-300">60+ days</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{analytics.salesVelocity.velocityByTimeframe["60+ days"]}</p>
                </div>
              </div>
              <div className="pt-2 text-center">
                <Badge variant="outline" className="text-xs">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {analytics.salesVelocity.velocityTrend} velocity trend
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Alerts */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-flash-green" />
            Smart Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {alertsByType.danger.length > 0 && (
              <div className="space-y-2">
                {alertsByType.danger.map((alert, index) => (
                  <div key={index} className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">{alert.message}</p>
                        <p className="text-xs text-red-600 dark:text-red-300 mt-1">{alert.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {alertsByType.warning.length > 0 && (
              <div className="space-y-2">
                {alertsByType.warning.map((alert, index) => (
                  <div key={index} className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{alert.message}</p>
                        <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">{alert.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {alertsByType.success.length > 0 && (
              <div className="space-y-2">
                {alertsByType.success.map((alert, index) => (
                  <div key={index} className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-start">
                      <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">{alert.message}</p>
                        <p className="text-xs text-green-600 dark:text-green-300 mt-1">{alert.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <LightBulbIcon className="h-5 w-5 mr-2 text-flash-green" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {analytics.recommendations.map((rec, index) => (
              <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                <Badge variant={rec.priority === "high" ? "destructive" : rec.priority === "medium" ? "warning" : "secondary"} className="mb-2 text-xs">
                  {rec.type}
                </Badge>
                <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">{rec.action}</p>
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Impact: <span className="font-medium text-gray-900 dark:text-white">{rec.impact}</span>
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Next Actions */}
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2 text-flash-green" />
            Recommended Next Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:border-flash-green transition-colors cursor-pointer">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">📊</span>
                <h4 className="font-medium text-gray-900 dark:text-white">Review pipeline health metrics</h4>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:border-flash-green transition-colors cursor-pointer">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">🎯</span>
                <h4 className="font-medium text-gray-900 dark:text-white">Implement top recommendations</h4>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:border-flash-green transition-colors cursor-pointer">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">📈</span>
                <h4 className="font-medium text-gray-900 dark:text-white">Monitor key performance indicators</h4>
              </div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 hover:border-flash-green transition-colors cursor-pointer">
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-2">📅</span>
                <h4 className="font-medium text-gray-900 dark:text-white">Schedule team performance review</h4>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
