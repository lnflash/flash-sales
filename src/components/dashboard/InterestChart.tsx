'use client';

import { useEffect, useRef } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Line } from 'react-chartjs-2';

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

interface MonthlyData {
  month: string;
  count: number;
}

interface InterestChartProps {
  data: MonthlyData[];
  isLoading?: boolean;
}

export default function InterestChart({ data, isLoading = false }: InterestChartProps) {
  const chartRef = useRef<ChartJS>(null);

  // Update gradient when chart renders
  useEffect(() => {
    const chart = chartRef.current;
    
    if (!chart) {
      return;
    }

    const ctx = chart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(0, 168, 107, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 168, 107, 0)');
    
    if (chart.data.datasets[0]) {
      chart.data.datasets[0].backgroundColor = gradient;
      chart.update();
    }
  }, []);

  const chartData = {
    labels: data.map(item => item.month),
    datasets: [
      {
        label: 'Submissions',
        data: data.map(item => item.count),
        borderColor: '#00A86B',
        borderWidth: 2,
        pointBackgroundColor: '#00A86B',
        pointBorderColor: '#1E293B',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.2,
        fill: true,
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
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#00A86B',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (tooltipItems: any) => {
            return `${tooltipItems[0].label}`;
          },
          label: (context: any) => {
            return `Submissions: ${context.raw}`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(107, 114, 128, 0.1)',
          drawBorder: false,
        },
        ticks: {
          color: '#6B7280',
          precision: 0,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md h-80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-flash-green"></div>
      </div>
    );
  }

  return (
    <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-white">Submission Trends</h3>
        <select 
          className="bg-flash-dark-2 text-white border border-flash-dark-3 rounded-md px-3 py-1 text-sm"
          defaultValue="month"
        >
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>
      
      <div className="h-64">
        <Line 
          ref={chartRef} 
          data={chartData} 
          options={options as any} 
        />
      </div>
    </div>
  );
}