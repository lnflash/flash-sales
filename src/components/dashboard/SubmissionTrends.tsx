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
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);
      
      // Count submissions in this week
      const weekSubmissions = submissions.filter(sub => {
        const subDate = new Date(sub.timestamp);
        return subDate >= weekStart && subDate <= weekEnd;
      });
      
      const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()}`;
      
      weeksData.push({
        month: weekLabel,
        count: weekSubmissions.length
      });
    }
    
    return weeksData;
  }, [submissions]);

  const stats = useMemo(() => {
    if (processedData.length === 0) return { total: 0, average: 0, growth: 0 };
    
    const total = processedData.reduce((sum, item) => sum + item.count, 0);
    const average = Math.round(total / processedData.length);
    
    // Calculate growth rate (comparing first and last period)
    const firstPeriod = processedData[0]?.count || 0;
    const lastPeriod = processedData[processedData.length - 1]?.count || 0;
    const growth = firstPeriod > 0 ? Math.round(((lastPeriod - firstPeriod) / firstPeriod) * 100) : 0;
    
    return { total, average, growth };
  }, [processedData]);

  const chartData = {
    labels: processedData.map(item => item.month),
    datasets: [
      {
        label: 'Submissions',
        data: processedData.map(item => item.count),
        backgroundColor: 'rgba(34, 197, 94, 0.8)', // flash-green with opacity
        borderColor: 'rgb(34, 197, 94)', // flash-green
        borderWidth: 1,
        borderRadius: 4,
        borderSkipped: false,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)', // flash-dark-3
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(55, 65, 81, 1)', // flash-dark-2
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          title: function(context: any) {
            return `${context[0].label}`;
          },
          label: function(context: any) {
            return `Submissions: ${context.parsed.y}`;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF', // gray-400
          font: {
            size: 12,
          }
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(55, 65, 81, 0.3)', // flash-dark-2 with opacity
        },
        ticks: {
          color: '#9CA3AF', // gray-400
          font: {
            size: 12,
          },
          stepSize: 1,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-flash-dark-2 rounded w-1/3 mb-6"></div>
          <div className="h-64 bg-flash-dark-2 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h3 className="text-lg font-medium text-white mb-2">
            Submission Trends - Last 8 Weeks
          </h3>
          <div className="flex items-center space-x-4 text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <ChartBarIcon className="h-4 w-4" />
              <span>Total: {stats.total}</span>
            </div>
            <div className="flex items-center space-x-1">
              <CalendarDaysIcon className="h-4 w-4" />
              <span>Avg: {stats.average}</span>
            </div>
            <div className={`flex items-center space-x-1 ${stats.growth >= 0 ? 'text-flash-green' : 'text-red-400'}`}>
              {stats.growth >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
              <span>{stats.growth >= 0 ? '+' : ''}{stats.growth}% growth</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bar Chart */}
      {processedData.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-gray-400">
          <p>No data available</p>
        </div>
      ) : (
        <div className="h-64">
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}
    </div>
  );
}