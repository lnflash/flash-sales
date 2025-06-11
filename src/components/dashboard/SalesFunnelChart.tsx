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
  FunnelIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface SalesFunnelData {
  stage: string;
  count: number;
  conversionRate: number;
  dropoffRate: number;
}

interface SalesFunnelChartProps {
  submissions: any[];
  isLoading?: boolean;
}

export default function SalesFunnelChart({ submissions, isLoading = false }: SalesFunnelChartProps) {
  const funnelData = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];

    const totalSubmissions = submissions.length;
    const packageSeen = submissions.filter(s => s.packageSeen).length;
    const qualified = submissions.filter(s => s.interestLevel >= 3).length;
    const hotProspects = submissions.filter(s => s.interestLevel >= 4).length;
    const conversions = submissions.filter(s => s.signedUp).length;

    const stages: SalesFunnelData[] = [
      {
        stage: 'Initial Contact',
        count: totalSubmissions,
        conversionRate: 100,
        dropoffRate: 0
      },
      {
        stage: 'Package Presented',
        count: packageSeen,
        conversionRate: totalSubmissions > 0 ? (packageSeen / totalSubmissions) * 100 : 0,
        dropoffRate: totalSubmissions > 0 ? ((totalSubmissions - packageSeen) / totalSubmissions) * 100 : 0
      },
      {
        stage: 'Qualified Lead',
        count: qualified,
        conversionRate: totalSubmissions > 0 ? (qualified / totalSubmissions) * 100 : 0,
        dropoffRate: packageSeen > 0 ? ((packageSeen - qualified) / packageSeen) * 100 : 0
      },
      {
        stage: 'Hot Prospect',
        count: hotProspects,
        conversionRate: totalSubmissions > 0 ? (hotProspects / totalSubmissions) * 100 : 0,
        dropoffRate: qualified > 0 ? ((qualified - hotProspects) / qualified) * 100 : 0
      },
      {
        stage: 'Conversion',
        count: conversions,
        conversionRate: totalSubmissions > 0 ? (conversions / totalSubmissions) * 100 : 0,
        dropoffRate: hotProspects > 0 ? ((hotProspects - conversions) / hotProspects) * 100 : 0
      }
    ];

    return stages;
  }, [submissions]);

  const chartData = {
    labels: funnelData.map(stage => stage.stage),
    datasets: [
      {
        label: 'Count',
        data: funnelData.map(stage => stage.count),
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',   // flash-green
          'rgba(59, 130, 246, 0.8)',  // blue
          'rgba(168, 85, 247, 0.8)',  // purple
          'rgba(245, 158, 11, 0.8)',  // amber
          'rgba(239, 68, 68, 0.8)'    // red
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 1,
        borderRadius: 6,
        borderSkipped: false,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y' as const,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgba(55, 65, 81, 1)',
        borderWidth: 1,
        cornerRadius: 6,
        displayColors: false,
        callbacks: {
          title: function(context: any) {
            return context[0].label;
          },
          label: function(context: any) {
            const stage = funnelData[context.dataIndex];
            return [
              `Count: ${stage.count}`,
              `Conversion Rate: ${stage.conversionRate.toFixed(1)}%`,
              `Drop-off Rate: ${stage.dropoffRate.toFixed(1)}%`
            ];
          }
        }
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: 'rgba(55, 65, 81, 0.3)',
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 12,
          }
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#9CA3AF',
          font: {
            size: 12,
          }
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
        <div className="animate-pulse">
          <div className="h-6 bg-flash-dark-2 rounded w-1/3 mb-6"></div>
          <div className="h-80 bg-flash-dark-2 rounded"></div>
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
            <FunnelIcon className="h-5 w-5 mr-2 text-flash-green" />
            Sales Funnel Analysis
          </h3>
          <p className="text-sm text-gray-400 mt-1">Conversion rates and drop-off points</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-flash-green">
            {funnelData.length > 0 ? funnelData[funnelData.length - 1].conversionRate.toFixed(1) : '0.0'}%
          </div>
          <div className="text-xs text-gray-400">Overall Conversion</div>
        </div>
      </div>

      {/* Funnel Chart */}
      {funnelData.length === 0 ? (
        <div className="flex items-center justify-center h-80 text-gray-400">
          <p>No data available</p>
        </div>
      ) : (
        <div className="h-80 mb-6">
          <Bar data={chartData} options={chartOptions} />
        </div>
      )}

      {/* Funnel Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {funnelData.slice(1).map((stage, index) => (
          <div key={stage.stage} className="bg-flash-dark-2 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-400 uppercase tracking-wide">
                {stage.stage}
              </div>
              {stage.dropoffRate > 50 && (
                <div className="text-red-400">
                  <ArrowTrendingUpIcon className="h-4 w-4 rotate-180" />
                </div>
              )}
            </div>
            <div className="text-xl font-bold text-white mb-1">
              {stage.count}
            </div>
            <div className="flex items-center text-sm">
              <span className="text-gray-300">
                {stage.conversionRate.toFixed(1)}% rate
              </span>
              <ArrowRightIcon className="h-3 w-3 mx-2 text-gray-400" />
              <span className={`${stage.dropoffRate > 30 ? 'text-red-400' : 'text-gray-400'}`}>
                {stage.dropoffRate.toFixed(1)}% drop
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}