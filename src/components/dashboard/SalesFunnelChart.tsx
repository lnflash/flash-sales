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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

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
    labels: funnelData.map(d => d.stage),
    datasets: [
      {
        label: 'Prospects',
        data: funnelData.map(d => d.count),
        backgroundColor: [
          '#00A86B', // Flash green
          '#00C17D', // Light green
          '#3B82F6', // Blue
          '#8B5CF6', // Purple
          '#F59E0B', // Amber
        ],
        borderRadius: 6,
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
        callbacks: {
          label: function(context: any) {
            const index = context.dataIndex;
            const data = funnelData[index];
            return [
              `Count: ${data.count}`,
              `Conversion: ${data.conversionRate.toFixed(1)}%`,
              `Drop-off: ${data.dropoffRate.toFixed(1)}%`
            ];
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
          color: '#6B7280',
          font: {
            size: 11,
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

  if (isLoading) {
    return (
      <Card className="bg-white border-light-border">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-light-text-primary">Sales Funnel Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-80 bg-light-bg-tertiary rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall conversion rate
  const overallConversion = funnelData.length > 0 && funnelData[0].count > 0
    ? ((funnelData[funnelData.length - 1].count / funnelData[0].count) * 100).toFixed(1)
    : '0';

  return (
    <Card className="bg-white border-light-border hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-5 w-5 text-flash-green" />
            <CardTitle className="text-lg font-semibold text-light-text-primary">
              Sales Funnel Analysis
            </CardTitle>
          </div>
          <Badge 
            variant="success"
            className="text-xs"
          >
            {overallConversion}% Overall
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80 mb-6">
          <Bar data={chartData} options={options} />
        </div>
        
        {/* Funnel stages breakdown */}
        <div className="space-y-3">
          {funnelData.map((stage, index) => (
            <div key={stage.stage} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  index === 0 ? "bg-flash-green" :
                  index === 1 ? "bg-flash-green-light" :
                  index === 2 ? "bg-blue-500" :
                  index === 3 ? "bg-purple-500" :
                  "bg-amber-500"
                )} />
                <span className="text-sm text-light-text-secondary">{stage.stage}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-light-text-primary">
                  {stage.count}
                </span>
                {index < funnelData.length - 1 && (
                  <ArrowRightIcon className="h-3 w-3 text-light-text-tertiary" />
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Conversion insights */}
        <div className="mt-6 p-4 bg-light-bg-secondary rounded-lg border border-light-border">
          <div className="flex items-center gap-2 mb-2">
            <ArrowTrendingUpIcon className="h-4 w-4 text-flash-green" />
            <p className="text-sm font-medium text-light-text-primary">
              Conversion Insights
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-light-text-secondary">Best Performing Stage</p>
              <p className="font-medium text-light-text-primary">
                {funnelData.length > 1 ? funnelData[1].stage : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-light-text-secondary">Biggest Drop-off</p>
              <p className="font-medium text-light-text-primary">
                {funnelData.reduce((max, stage, index) => 
                  index > 0 && stage.dropoffRate > (max?.dropoffRate || 0) ? stage : max
                , funnelData[0])?.stage || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}