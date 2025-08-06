"use client";

import { useEffect, useRef } from "react";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SparklesIcon } from "@heroicons/react/24/outline";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface InterestDistributionProps {
  distribution: number[];
  isLoading?: boolean;
}

export default function InterestDistributionChart({ distribution, isLoading = false }: InterestDistributionProps) {
  // Use a more specific type for the Chart.js component
  const chartRef = useRef<any>(null);

  useEffect(() => {
    const chart = chartRef.current;

    if (!chart) {
      return;
    }

    // Only run this effect if the chart has been initialized
    if (chart.ctx) {
      const ctx = chart.ctx;
      const gradients = distribution.map((_, index) => {
        const ratio = index / (distribution.length - 1);
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);

        // Green to yellow gradient based on interest level
        if (ratio < 0.3) {
          // Low interest - red to orange
          gradient.addColorStop(0, "#EF4444");
          gradient.addColorStop(1, "#F59E0B");
        } else if (ratio < 0.7) {
          // Medium interest - yellow
          gradient.addColorStop(0, "#F59E0B");
          gradient.addColorStop(1, "#84CC16");
        } else {
          // High interest - green
          gradient.addColorStop(0, "#84CC16");
          gradient.addColorStop(1, "#00A86B");
        }

        return gradient;
      });

      // Update chart data with gradients
      if (chart.chart) {
        chart.chart.data.datasets[0].backgroundColor = gradients;
        chart.chart.update();
      }
    }
  }, [distribution]);

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Interest Level Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = {
    labels: ["Level 1", "Level 2", "Level 3", "Level 4", "Level 5"],
    datasets: [
      {
        label: "Count",
        data: distribution,
        backgroundColor: "#00A86B",
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
            return `${context.parsed.y} submissions`;
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
            size: 12,
          },
        },
      },
      y: {
        grid: {
          color: "#F3F4F6",
        },
        ticks: {
          color: "#6B7280",
          font: {
            size: 12,
          },
        },
      },
    },
  };

  return (
    <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="h-5 w-5 text-flash-green" />
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">Interest Level Distribution</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <Bar ref={chartRef} data={data} options={options} />
        </div>
      </CardContent>
    </Card>
  );
}
