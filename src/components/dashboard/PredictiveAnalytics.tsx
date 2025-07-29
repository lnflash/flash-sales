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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
          data: [...historicalCounts, null, null, null],
          borderColor: '#00A86B',
          backgroundColor: 'rgba(0, 168, 107, 0.1)',
          tension: 0.4,
          fill: true,
        },
        {
          label: 'Predicted Conversions',
          data: [...new Array(historicalCounts.length - 1).fill(null), historicalCounts[historicalCounts.length - 1], ...forecastCounts],
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderDash: [5, 5],
          tension: 0.4,
          fill: true,
        }
      ]
    };
  }, [predictions, historicalData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: '#6B7280',
          font: {
            size: 12
          },
          usePointStyle: true,
          pointStyle: 'circle'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: {
          size: 14,
          weight: 600,
        },
        bodyFont: {
          size: 13,
        },
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 11,
          }
        }
      },
      y: {
        grid: {
          color: '#F3F4F6',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          }
        }
      }
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white border-light-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-light-text-primary">Predictive Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-80 bg-light-bg-tertiary rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-light-border hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BeakerIcon className="h-5 w-5 text-flash-green" />
            <CardTitle className="text-lg font-semibold text-light-text-primary">
              Predictive Analytics
            </CardTitle>
          </div>
          <Badge 
            variant={predictions.trend === 'increasing' ? 'success' : predictions.trend === 'decreasing' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            <ArrowTrendingUpIcon className="h-3 w-3 mr-1" />
            {predictions.trend} Trend
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {forecastData && (
          <div className="h-64 mb-6">
            <Line data={forecastData} options={chartOptions} />
          </div>
        )}
        
        {/* Predictions Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-3 bg-light-bg-secondary rounded-lg border border-light-border">
            <p className="text-xs text-light-text-secondary mb-1">7-Day Forecast</p>
            <p className="text-lg font-bold text-light-text-primary">
              {predictions.forecastedConversions.next7Days}
            </p>
            <p className="text-xs text-light-text-tertiary">conversions</p>
          </div>
          <div className="text-center p-3 bg-light-bg-secondary rounded-lg border border-light-border">
            <p className="text-xs text-light-text-secondary mb-1">30-Day Forecast</p>
            <p className="text-lg font-bold text-light-text-primary">
              {predictions.forecastedConversions.next30Days}
            </p>
            <p className="text-xs text-light-text-tertiary">conversions</p>
          </div>
          <div className="text-center p-3 bg-light-bg-secondary rounded-lg border border-light-border">
            <p className="text-xs text-light-text-secondary mb-1">90-Day Forecast</p>
            <p className="text-lg font-bold text-light-text-primary">
              {predictions.forecastedConversions.next90Days}
            </p>
            <p className="text-xs text-light-text-tertiary">conversions</p>
          </div>
        </div>
        
        {/* Key Predictions */}
        <div className="space-y-3">
          <div className="p-3 bg-light-bg-secondary rounded-lg border border-light-border">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ChartBarIcon className="h-4 w-4 text-flash-green" />
                <p className="text-sm font-medium text-light-text-primary">Next Month Projections</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-light-text-secondary">Expected Submissions</p>
                <p className="font-semibold text-light-text-primary">
                  {predictions.nextMonthProjections.expectedSubmissions}
                </p>
              </div>
              <div>
                <p className="text-light-text-secondary">Expected Conversions</p>
                <p className="font-semibold text-light-text-primary">
                  {predictions.nextMonthProjections.expectedConversions}
                </p>
              </div>
            </div>
          </div>
          
          <div className="p-3 bg-light-bg-secondary rounded-lg border border-light-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CircleStackIcon className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-light-text-primary">Conversion Probability</p>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {predictions.conversionProbability.overall.toFixed(1)}%
              </span>
            </div>
          </div>
          
          <div className="p-3 bg-light-bg-secondary rounded-lg border border-light-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-purple-600" />
                <p className="text-sm font-medium text-light-text-primary">Confidence Level</p>
              </div>
              <Badge 
                variant={predictions.confidence > 80 ? 'success' : predictions.confidence > 60 ? 'warning' : 'secondary'}
                className="text-xs"
              >
                {predictions.confidence}% confidence
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}