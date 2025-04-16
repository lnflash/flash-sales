'use client';

import { useEffect, useRef } from 'react';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend
);

interface InterestDistributionProps {
  distribution: number[];
  isLoading?: boolean;
}

export default function InterestDistributionChart({ 
  distribution, 
  isLoading = false 
}: InterestDistributionProps) {
  const chartRef = useRef<ChartJS>(null);

  useEffect(() => {
    const chart = chartRef.current;
    
    if (!chart) {
      return;
    }

    const ctx = chart.ctx;
    const gradients = distribution.map((_, index) => {
      const ratio = index / (distribution.length - 1);
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      
      // Green to yellow gradient based on interest level
      const r = Math.round(0 + ratio * 255);
      const g = Math.round(168 - ratio * 25);
      const b = Math.round(107 - ratio * 107);
      
      gradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0.5)`);
      
      return gradient;
    });
    
    if (chart.data.datasets[0]) {
      chart.data.datasets[0].backgroundColor = gradients;
      chart.update();
    }
  }, [distribution]);

  const chartData = {
    labels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'],
    datasets: [
      {
        label: 'Submissions',
        data: distribution,
        borderWidth: 0,
        borderRadius: 5,
        maxBarThickness: 50,
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
        <h3 className="text-lg font-medium text-white">Interest Level Distribution</h3>
      </div>
      
      <div className="h-64">
        <Bar 
          ref={chartRef} 
          data={chartData} 
          options={options as any} 
        />
      </div>
    </div>
  );
}