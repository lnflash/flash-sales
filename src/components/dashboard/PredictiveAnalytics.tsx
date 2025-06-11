'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { 
  BeakerIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CircleStackIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { PredictiveInsights } from '@/utils/advanced-analytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PredictiveAnalyticsProps {
  predictions: PredictiveInsights;
  historicalData: any[];
  isLoading?: boolean;
}

export default function PredictiveAnalytics({ predictions, historicalData, isLoading = false }: PredictiveAnalyticsProps) {
  const forecastData = useMemo(() => {
    if (!historicalData || historicalData.length === 0) return null;

    // Generate last 12 weeks of historical data
    const weeks: string[] = [];
    const historicalCounts: number[] = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      weeks.push(weekLabel);
      
      // Count conversions for this week
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekConversions = historicalData.filter(sub => {
        const subDate = new Date(sub.timestamp);
        return sub.signedUp && subDate >= weekStart && subDate <= weekEnd;
      }).length;
      
      historicalCounts.push(weekConversions);
    }

    // Add forecasted periods
    const forecastWeeks = ['Next 7d', 'Next 30d', 'Next 90d'];
    const forecastCounts = [
      predictions.forecastedConversions.next7Days,
      predictions.forecastedConversions.next30Days / 4, // Convert to weekly
      predictions.forecastedConversions.next90Days / 12 // Convert to weekly
    ];

    return {
      labels: [...weeks, ...forecastWeeks],
      datasets: [
        {
          label: 'Historical Conversions',
          data: [...historicalCounts, ...Array(3).fill(null)],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          pointBackgroundColor: 'rgb(34, 197, 94)',
          pointBorderColor: 'rgb(34, 197, 94)',
          pointRadius: 4,
          tension: 0.3,
          fill: true,
        },
        {
          label: 'Predicted Conversions',
          data: [...Array(12).fill(null), ...forecastCounts],
          borderColor: 'rgb(168, 85, 247)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          pointBackgroundColor: 'rgb(168, 85, 247)',
          pointBorderColor: 'rgb(168, 85, 247)',
          pointRadius: 4,
          borderDash: [5, 5],
          tension: 0.3,
          fill: true,
        }
      ]
    };
  }, [historicalData, predictions]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#9CA3AF',
          font: {
            size: 12,
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(55, 65, 81, 1)',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(55, 65, 81, 0.3)',
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11,
          }
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(55, 65, 81, 0.3)',
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 11,
          }
        },
      },
    },
  };

  const getTrendIcon = () => {
    switch (predictions.trendAnalysis.direction) {
      case 'up':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-flash-green" />;
      case 'down':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-red-400" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getTrendColor = () => {
    switch (predictions.trendAnalysis.direction) {
      case 'up':
        return 'text-flash-green';
      case 'down':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-flash-dark-2 rounded w-1/3 mb-6"></div>
          <div className="h-80 bg-flash-dark-2 rounded mb-6"></div>
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-flash-dark-2 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-white flex items-center">
            <BeakerIcon className="h-5 w-5 mr-2 text-purple-400" />
            Predictive Analytics
          </h3>
          <p className="text-sm text-gray-400 mt-1">AI-powered forecasting and trend analysis</p>
        </div>
        <div className="text-right">
          <div className={`flex items-center ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="ml-2 text-sm font-medium">
              {predictions.trendAnalysis.direction.charAt(0).toUpperCase() + predictions.trendAnalysis.direction.slice(1)} Trend
            </span>
          </div>
          <div className="text-xs text-gray-400">
            {predictions.trendAnalysis.confidence}% confidence
          </div>
        </div>
      </div>

      {/* Forecast Chart */}
      {forecastData ? (
        <div className="h-80 mb-6">
          <Line data={forecastData} options={chartOptions} />
        </div>
      ) : (
        <div className="flex items-center justify-center h-80 text-gray-400 mb-6">
          <p>Insufficient data for forecasting</p>
        </div>
      )}

      {/* Forecast Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-flash-dark-2 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <ClockIcon className="h-5 w-5 text-blue-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">Next 7 Days</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {predictions.forecastedConversions.next7Days}
          </div>
          <div className="text-sm text-gray-300">
            Predicted conversions
          </div>
        </div>

        <div className="bg-flash-dark-2 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <CircleStackIcon className="h-5 w-5 text-flash-green" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">Next 30 Days</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {predictions.forecastedConversions.next30Days}
          </div>
          <div className="text-sm text-gray-300">
            Monthly forecast
          </div>
        </div>

        <div className="bg-flash-dark-2 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <ChartBarIcon className="h-5 w-5 text-purple-400" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">Next 90 Days</span>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {predictions.forecastedConversions.next90Days}
          </div>
          <div className="text-sm text-gray-300">
            Quarterly projection
          </div>
        </div>
      </div>

      {/* Trend Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Strength */}
        <div className="bg-flash-dark-2 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-medium text-white">Trend Analysis</h4>
            <div className={`${getTrendColor()}`}>
              {getTrendIcon()}
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Trend Strength</span>
                <span className="text-sm font-medium text-white">
                  {predictions.trendAnalysis.strength.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    predictions.trendAnalysis.direction === 'up' ? 'bg-flash-green' :
                    predictions.trendAnalysis.direction === 'down' ? 'bg-red-400' :
                    'bg-gray-400'
                  }`}
                  style={{ width: `${Math.min(100, predictions.trendAnalysis.strength)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">Confidence Level</span>
                <span className="text-sm font-medium text-white">
                  {predictions.trendAnalysis.confidence.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-400 h-2 rounded-full"
                  style={{ width: `${predictions.trendAnalysis.confidence}%` }}
                ></div>
              </div>
            </div>
            
            <div className="pt-2">
              <span className="text-xs text-gray-400">
                Direction: {predictions.trendAnalysis.direction.charAt(0).toUpperCase() + predictions.trendAnalysis.direction.slice(1)}
              </span>
            </div>
          </div>
        </div>

        {/* Scenario Planning */}
        <div className="bg-flash-dark-2 rounded-lg p-4">
          <h4 className="text-lg font-medium text-white mb-4">Scenario Planning</h4>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-green-900 bg-opacity-20 rounded-lg border border-green-800">
              <div>
                <div className="text-sm font-medium text-green-200">Best Case</div>
                <div className="text-xs text-green-300">+20% above forecast</div>
              </div>
              <div className="text-lg font-bold text-green-400">
                {Math.round(predictions.forecastedConversions.next30Days * 1.2)}
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-blue-900 bg-opacity-20 rounded-lg border border-blue-800">
              <div>
                <div className="text-sm font-medium text-blue-200">Expected</div>
                <div className="text-xs text-blue-300">Current forecast</div>
              </div>
              <div className="text-lg font-bold text-blue-400">
                {predictions.forecastedConversions.next30Days}
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-red-900 bg-opacity-20 rounded-lg border border-red-800">
              <div>
                <div className="text-sm font-medium text-red-200">Worst Case</div>
                <div className="text-xs text-red-300">-20% below forecast</div>
              </div>
              <div className="text-lg font-bold text-red-400">
                {Math.round(predictions.forecastedConversions.next30Days * 0.8)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Model Accuracy */}
      <div className="mt-6 p-4 bg-flash-dark-2 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h5 className="text-sm font-medium text-white">Model Performance</h5>
            <p className="text-xs text-gray-400">
              Prediction accuracy based on historical data and current trends
            </p>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-flash-green">
              {predictions.trendAnalysis.confidence.toFixed(0)}%
            </div>
            <div className="text-xs text-gray-400">Accuracy Score</div>
          </div>
        </div>
      </div>
    </div>
  );
}