"use client";

import { useMemo } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { FunnelIcon, ArrowRightIcon, ArrowTrendingUpIcon } from "@heroicons/react/24/outline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useMobileMenu } from "@/contexts/MobileMenuContext";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

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
  const { isMobile } = useMobileMenu();
  const funnelData = useMemo(() => {
    if (!submissions || submissions.length === 0) return [];

    const totalSubmissions = submissions.length;
    const packageSeen = submissions.filter((s) => s.packageSeen).length;
    const qualified = submissions.filter((s) => s.interestLevel >= 3).length;
    const hotProspects = submissions.filter((s) => s.interestLevel >= 4).length;
    const conversions = submissions.filter((s) => s.signedUp).length;

    const stages: SalesFunnelData[] = [
      {
        stage: "Initial Contact",
        count: totalSubmissions,
        conversionRate: 100,
        dropoffRate: 0,
      },
      {
        stage: "Package Presented",
        count: packageSeen,
        conversionRate: totalSubmissions > 0 ? (packageSeen / totalSubmissions) * 100 : 0,
        dropoffRate: totalSubmissions > 0 ? ((totalSubmissions - packageSeen) / totalSubmissions) * 100 : 0,
      },
      {
        stage: "Qualified Lead",
        count: qualified,
        conversionRate: totalSubmissions > 0 ? (qualified / totalSubmissions) * 100 : 0,
        dropoffRate: packageSeen > 0 ? ((packageSeen - qualified) / packageSeen) * 100 : 0,
      },
      {
        stage: "Hot Prospect",
        count: hotProspects,
        conversionRate: totalSubmissions > 0 ? (hotProspects / totalSubmissions) * 100 : 0,
        dropoffRate: qualified > 0 ? ((qualified - hotProspects) / qualified) * 100 : 0,
      },
      {
        stage: "Conversion",
        count: conversions,
        conversionRate: totalSubmissions > 0 ? (conversions / totalSubmissions) * 100 : 0,
        dropoffRate: hotProspects > 0 ? ((hotProspects - conversions) / hotProspects) * 100 : 0,
      },
    ];

    return stages;
  }, [submissions]);

  const chartData = {
    labels: funnelData.map((d) => d.stage),
    datasets: [
      {
        label: "Prospects",
        data: funnelData.map((d) => d.count),
        backgroundColor: [
          "#00A86B", // Flash green
          "#00C17D", // Light green
          "#3B82F6", // Blue
          "#8B5CF6", // Purple
          "#F59E0B", // Amber
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
        backgroundColor: "rgba(0, 0, 0, 0.8)",
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
          label: function (context: any) {
            const index = context.dataIndex;
            const data = funnelData[index];
            return [`Count: ${data.count}`, `Conversion: ${data.conversionRate.toFixed(1)}%`, `Drop-off: ${data.dropoffRate.toFixed(1)}%`];
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: isMobile ? 9 : 11,
          },
          autoSkip: true,
          maxRotation: isMobile ? 45 : 0,
        },
      },
      y: {
        grid: {
          color: "#F3F4F6",
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: isMobile ? 10 : 12,
          },
          maxTicksLimit: isMobile ? 5 : undefined,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Sales Funnel Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate overall conversion rate
  const overallConversion =
    funnelData.length > 0 && funnelData[0].count > 0 ? ((funnelData[funnelData.length - 1].count / funnelData[0].count) * 100).toFixed(1) : "0";

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <FunnelIcon className="h-4 sm:h-5 w-4 sm:w-5 text-flash-green" />
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Sales Funnel Analysis</CardTitle>
          </div>
          <Badge variant="success" className="text-xs w-fit">
            {overallConversion}% Overall
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="h-64 sm:h-80 mb-4 sm:mb-6">
          <Bar data={chartData} options={options} />
        </div>

        {/* Funnel stages breakdown */}
        <div className="space-y-2 sm:space-y-3">
          {funnelData.map((stage, index) => (
            <div key={stage.stage} className="flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div
                  className={cn(
                    "w-2 h-2 rounded-full flex-shrink-0",
                    index === 0
                      ? "bg-flash-green"
                      : index === 1
                      ? "bg-flash-green-light"
                      : index === 2
                      ? "bg-blue-500"
                      : index === 3
                      ? "bg-purple-500"
                      : "bg-amber-500"
                  )}
                />
                <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 truncate">{stage.stage}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{stage.count}</span>
                {index < funnelData.length - 1 && <ArrowRightIcon className="h-3 w-3 text-gray-400 dark:text-gray-500 hidden sm:block" />}
              </div>
            </div>
          ))}
        </div>

        {/* Conversion insights */}
        <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-2 mb-2">
            <ArrowTrendingUpIcon className="h-3 sm:h-4 w-3 sm:w-4 text-flash-green" />
            <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">Conversion Insights</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 text-xs">
            <div>
              <p className="text-gray-600 dark:text-gray-300">Best Performing</p>
              <p className="font-medium text-gray-900 dark:text-white truncate">{funnelData.length > 1 ? funnelData[1].stage : "N/A"}</p>
            </div>
            <div>
              <p className="text-gray-600 dark:text-gray-300">Biggest Drop-off</p>
              <p className="font-medium text-gray-900 dark:text-white truncate">
                {funnelData.reduce((max, stage, index) => (index > 0 && stage.dropoffRate > (max?.dropoffRate || 0) ? stage : max), funnelData[0])?.stage ||
                  "N/A"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
