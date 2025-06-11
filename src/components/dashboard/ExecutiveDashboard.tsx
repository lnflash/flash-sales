'use client';

import { useMemo } from 'react';
import { 
  TrophyIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import { AdvancedAnalytics } from '@/utils/advanced-analytics';

interface ExecutiveDashboardProps {
  analytics: AdvancedAnalytics;
  isLoading?: boolean;
}

export default function ExecutiveDashboard({ analytics, isLoading = false }: ExecutiveDashboardProps) {
  const alertsByType = useMemo(() => {
    const alerts = analytics.executiveSummary.alerts;
    return {
      success: alerts.filter(a => a.type === 'success'),
      warning: alerts.filter(a => a.type === 'warning'),
      danger: alerts.filter(a => a.type === 'danger')
    };
  }, [analytics.executiveSummary.alerts]);

  const getMetricIcon = (label: string) => {
    switch (label.toLowerCase()) {
      case 'conversion rate':
        return <ChartBarIcon className="h-5 w-5" />;
      case 'pipeline size':
        return <CurrencyDollarIcon className="h-5 w-5" />;
      case 'avg. interest':
        return <ArrowTrendingUpIcon className="h-5 w-5" />;
      case 'hot prospects':
        return <TrophyIcon className="h-5 w-5" />;
      default:
        return <ChartBarIcon className="h-5 w-5" />;
    }
  };

  const getMetricColor = (trend: number) => {
    if (trend > 0) return 'text-flash-green';
    if (trend < 0) return 'text-red-400';
    return 'text-gray-400';
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
            <div key={i} className="bg-flash-dark-3 rounded-lg p-6 shadow-md animate-pulse">
              <div className="h-6 bg-flash-dark-2 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-flash-dark-2 rounded w-3/4"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-flash-dark-3 rounded-lg p-6 shadow-md animate-pulse">
              <div className="h-6 bg-flash-dark-2 rounded w-1/3 mb-4"></div>
              <div className="h-32 bg-flash-dark-2 rounded"></div>
            </div>
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
          <div key={metric.label} className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2 rounded-lg ${
                index === 0 ? 'bg-flash-green bg-opacity-20 text-flash-green' :
                index === 1 ? 'bg-blue-500 bg-opacity-20 text-blue-400' :
                index === 2 ? 'bg-purple-500 bg-opacity-20 text-purple-400' :
                'bg-amber-500 bg-opacity-20 text-amber-400'
              }`}>
                {getMetricIcon(metric.label)}
              </div>
              <div className={`flex items-center text-sm ${getMetricColor(metric.trend)}`}>
                {getTrendIcon(metric.trend)}
                <span className="ml-1">
                  {metric.trend > 0 ? '+' : ''}{metric.trend.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {metric.value}
            </div>
            <div className="text-sm text-gray-400">
              {metric.label}
            </div>
          </div>
        ))}
      </div>

      {/* Strategic Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Health */}
        <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
          <div className="flex items-center mb-4">
            <CurrencyDollarIcon className="h-5 w-5 mr-2 text-flash-green" />
            <h3 className="text-lg font-medium text-white">Pipeline Health</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Total Pipeline</span>
              <span className="text-xl font-bold text-white">
                {analytics.pipelineHealth.totalPipeline}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Qualified Leads</span>
              <span className="text-lg font-semibold text-blue-400">
                {analytics.pipelineHealth.qualifiedLeads}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Hot Prospects</span>
              <span className="text-lg font-semibold text-amber-400">
                {analytics.pipelineHealth.hotProspects}
              </span>
            </div>
            
            <div className="pt-4 border-t border-flash-dark-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Predicted Conversions</span>
                <span className="text-lg font-semibold text-flash-green">
                  {analytics.pipelineHealth.predictedConversions}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Bottleneck: {analytics.pipelineHealth.bottleneckStage}
              </div>
            </div>
          </div>
        </div>

        {/* Sales Velocity */}
        <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
          <div className="flex items-center mb-4">
            <ClockIcon className="h-5 w-5 mr-2 text-purple-400" />
            <h3 className="text-lg font-medium text-white">Sales Velocity</h3>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-300">Avg. Time to Convert</span>
              <span className="text-xl font-bold text-white">
                {analytics.salesVelocity.avgTimeToConversion.toFixed(0)} days
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="bg-flash-dark-2 rounded p-3">
                <div className="text-gray-400">0-7 days</div>
                <div className="text-flash-green font-semibold">
                  {analytics.salesVelocity.conversionsByTimeframe['0-7days']}
                </div>
              </div>
              <div className="bg-flash-dark-2 rounded p-3">
                <div className="text-gray-400">8-30 days</div>
                <div className="text-blue-400 font-semibold">
                  {analytics.salesVelocity.conversionsByTimeframe['8-30days']}
                </div>
              </div>
              <div className="bg-flash-dark-2 rounded p-3">
                <div className="text-gray-400">31-90 days</div>
                <div className="text-amber-400 font-semibold">
                  {analytics.salesVelocity.conversionsByTimeframe['31-90days']}
                </div>
              </div>
              <div className="bg-flash-dark-2 rounded p-3">
                <div className="text-gray-400">90+ days</div>
                <div className="text-red-400 font-semibold">
                  {analytics.salesVelocity.conversionsByTimeframe['90+days']}
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-flash-dark-2">
              <div className={`flex items-center ${getMetricColor(analytics.salesVelocity.velocityTrend)}`}>
                {getTrendIcon(analytics.salesVelocity.velocityTrend)}
                <span className="ml-2 text-sm">
                  {analytics.salesVelocity.velocityTrend > 0 ? '+' : ''}
                  {analytics.salesVelocity.velocityTrend.toFixed(1)}% velocity trend
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alerts and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart Alerts */}
        <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
          <div className="flex items-center mb-4">
            <ExclamationTriangleIcon className="h-5 w-5 mr-2 text-amber-400" />
            <h3 className="text-lg font-medium text-white">Smart Alerts</h3>
          </div>
          
          <div className="space-y-3">
            {alertsByType.danger.map((alert, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-red-900 bg-opacity-20 rounded-lg border border-red-800">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
                <span className="text-red-200 text-sm">{alert.message}</span>
              </div>
            ))}
            
            {alertsByType.warning.map((alert, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-amber-900 bg-opacity-20 rounded-lg border border-amber-800">
                <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 mt-0.5" />
                <span className="text-amber-200 text-sm">{alert.message}</span>
              </div>
            ))}
            
            {alertsByType.success.map((alert, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 bg-green-900 bg-opacity-20 rounded-lg border border-green-800">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mt-0.5" />
                <span className="text-green-200 text-sm">{alert.message}</span>
              </div>
            ))}
            
            {analytics.executiveSummary.alerts.length === 0 && (
              <div className="flex items-center justify-center py-6 text-gray-400">
                <CheckCircleIcon className="h-5 w-5 mr-2" />
                <span>All systems performing well</span>
              </div>
            )}
          </div>
        </div>

        {/* Strategic Recommendations */}
        <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
          <div className="flex items-center mb-4">
            <LightBulbIcon className="h-5 w-5 mr-2 text-flash-yellow" />
            <h3 className="text-lg font-medium text-white">AI Recommendations</h3>
          </div>
          
          <div className="space-y-4">
            {analytics.predictions.recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="bg-flash-dark-2 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-800' :
                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {rec.priority.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-400">{rec.category}</span>
                </div>
                
                <div className="mb-2">
                  <div className="text-sm font-medium text-white mb-1">
                    {rec.insight}
                  </div>
                  <div className="text-sm text-gray-300">
                    {rec.action}
                  </div>
                </div>
                
                <div className="text-xs text-flash-green">
                  Expected: {rec.expectedImpact}
                </div>
              </div>
            ))}
            
            {analytics.predictions.recommendations.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <LightBulbIcon className="h-8 w-8 mx-auto mb-2" />
                <span>No recommendations at this time</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Next Actions */}
      <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
        <div className="flex items-center mb-4">
          <CheckCircleIcon className="h-5 w-5 mr-2 text-flash-green" />
          <h3 className="text-lg font-medium text-white">Recommended Next Actions</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {analytics.executiveSummary.nextActions.map((action, index) => (
            <div key={index} className="bg-flash-dark-2 rounded-lg p-4 hover:bg-opacity-80 transition-colors cursor-pointer">
              <div className="flex items-start space-x-3">
                <div className="text-flash-green font-bold text-lg">
                  {index + 1}
                </div>
                <span className="text-sm text-gray-300">{action}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}