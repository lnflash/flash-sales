'use client';

import { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { 
  ArrowUpIcon, 
  ArrowDownIcon,
  CalendarDaysIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface MonthlyData {
  month: string;
  count: number;
}

interface SubmissionTrendsProps {
  submissions: any[];
  isLoading?: boolean;
}

export default function SubmissionTrends({ submissions, isLoading = false }: SubmissionTrendsProps) {
  const processedData = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];
    
    // Generate last 8 weeks of data
    const weeksData: MonthlyData[] = [];
    const now = new Date();
    
    for (let i = 7; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      
      const weekSubmissions = submissions.filter(sub => {
        const subDate = new Date(sub.timestamp);
        return subDate >= weekStart && subDate < weekEnd;
      });
      
      const weekLabel = `W${8 - i}`;
      weeksData.push({
        month: weekLabel,
        count: weekSubmissions.length
      });
    }
    
    return weeksData;
  }, [submissions]);

  const chartData = {
    labels: processedData.map(d => d.month),
    datasets: [
      {
        label: 'Submissions',
        data: processedData.map(d => d.count),
        backgroundColor: '#00A86B',
        borderRadius: 6,
        maxBarThickness: 40,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
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
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: '#F3F4F6',
        },
        ticks: {
          color: '#6B7280',
          font: {
            size: 12,
          },
        },
      },
    },
  };

  // Calculate trend
  const currentWeek = processedData[processedData.length - 1]?.count || 0;
  const previousWeek = processedData[processedData.length - 2]?.count || 0;
  const percentageChange = previousWeek > 0 
    ? ((currentWeek - previousWeek) / previousWeek * 100).toFixed(1)
    : '0';
  const isPositiveTrend = currentWeek >= previousWeek;

  if (isLoading) {
    return (
      <Card className="bg-white border-light-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-light-text-primary">Submission Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-light-bg-tertiary rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-light-border hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-flash-green" />
            <CardTitle className="text-lg font-semibold text-light-text-primary">
              Submission Trends
            </CardTitle>
          </div>
          <Badge 
            variant={isPositiveTrend ? 'success' : 'warning'}
            className="flex items-center gap-1"
          >
            {isPositiveTrend ? (
              <ArrowUpIcon className="h-3 w-3" />
            ) : (
              <ArrowDownIcon className="h-3 w-3" />
            )}
            {percentageChange}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <CalendarDaysIcon className="h-4 w-4 text-light-text-secondary" />
          <p className="text-sm text-light-text-secondary">
            Last 8 weeks • {processedData.reduce((sum, d) => sum + d.count, 0)} total submissions
          </p>
        </div>
        <div className="h-64">
          <Bar data={chartData} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}