'use client';

import { useEffect, useRef, useState, useMemo } from 'react';
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
  ChartType,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useMobileMenu } from '@/contexts/MobileMenuContext';

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

type TimePeriod = 'week' | 'month' | 'year';

export default function InterestChart({ data, isLoading = false }: InterestChartProps) {
  // Use a more specific type for the Chart.js component
  const chartRef = useRef<any>(null);
  const { isMobile } = useMobileMenu();
  
  // State for time period selection
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('month');

  // Data filtering logic based on selected time period
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const now = new Date();
    
    switch (selectedPeriod) {
      case 'week': {
        // Show last 4 weeks of data
        const fourWeeksAgo = new Date(now);
        fourWeeksAgo.setDate(now.getDate() - 28);
        
        // Group monthly data into weeks for the last 4 weeks
        const weeklyData: MonthlyData[] = [];
        for (let i = 3; i >= 0; i--) {
          const weekStart = new Date(now);
          weekStart.setDate(now.getDate() - (i * 7));
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          
          // Format as "Week of MM/DD"
          const weekLabel = `Week of ${(weekStart.getMonth() + 1).toString().padStart(2, '0')}/${weekStart.getDate().toString().padStart(2, '0')}`;
          
          // For demo purposes, estimate weekly data from monthly data
          // In a real implementation, you'd want weekly data from the API
          const monthData = data.find(item => {
            const itemDate = new Date(item.month + '-01');
            return itemDate.getMonth() === weekStart.getMonth() && itemDate.getFullYear() === weekStart.getFullYear();
          });
          
          weeklyData.push({
            month: weekLabel,
            count: monthData ? Math.round(monthData.count / 4) : 0 // Rough weekly estimate
          });
        }
        return weeklyData;
      }
      
      case 'month': {
        // Show last 12 months (current behavior)
        const twelveMonthsAgo = new Date(now);
        twelveMonthsAgo.setMonth(now.getMonth() - 11);
        
        return data.filter(item => {
          const itemDate = new Date(item.month + '-01');
          return itemDate >= twelveMonthsAgo;
        }).slice(-12); // Ensure we only show 12 months max
      }
      
      case 'year': {
        // Group data by year, showing last 3 years
        const yearlyData: { [year: string]: number } = {};
        
        data.forEach(item => {
          const itemDate = new Date(item.month + '-01');
          const year = itemDate.getFullYear().toString();
          yearlyData[year] = (yearlyData[year] || 0) + item.count;
        });
        
        // Convert to array and sort, keep last 3 years
        const sortedYears = Object.keys(yearlyData).sort().slice(-3);
        return sortedYears.map(year => ({
          month: year,
          count: yearlyData[year]
        }));
      }
      
      default:
        return data;
    }
  }, [data, selectedPeriod]);

  // Update gradient when chart renders
  useEffect(() => {
    const chart = chartRef.current;
    
    if (!chart) {
      return;
    }

    // Only run this effect if the chart has been initialized
    if (chart.ctx) {
      const ctx = chart.ctx;
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, 'rgba(0, 168, 107, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 168, 107, 0)');
      
      if (chart.data && chart.data.datasets && chart.data.datasets[0]) {
        chart.data.datasets[0].backgroundColor = gradient;
        chart.update();
      }
    }
  }, []);

  const chartData = {
    labels: filteredData.map(item => item.month),
    datasets: [
      {
        label: 'Submissions',
        data: filteredData.map(item => item.count),
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
          maxTicksLimit: isMobile ? 5 : undefined,
        },
      },
    },
  };

  if (isLoading) {
    return (
      <div className="bg-flash-dark-3 rounded-lg p-6 shadow-md h-80 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-flash-green" role="status" aria-label="Loading chart data"></div>
      </div>
    );
  }

  return (
    <div className="bg-flash-dark-3 rounded-lg p-4 sm:p-6 shadow-md">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <h3 className="text-base sm:text-lg font-medium text-white">
          Submission Trends
          {selectedPeriod === 'week' && ' - Weekly'}
          {selectedPeriod === 'month' && ' - Monthly'}
          {selectedPeriod === 'year' && ' - Yearly'}
        </h3>
        <select 
          className="bg-flash-dark-2 text-white border border-flash-dark-3 rounded-md px-2 sm:px-3 py-1 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-flash-green"
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value as TimePeriod)}
        >
          <option value="week">Last 4 Weeks</option>
          <option value="month">Last 12 Months</option>
          <option value="year">Last 3 Years</option>
        </select>
      </div>
      
      <div className="h-48 sm:h-64">
        {filteredData.length === 0 && !isLoading ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <p>No data available for selected time period</p>
          </div>
        ) : (
          <Line 
            ref={chartRef} 
            data={chartData} 
            options={options as any} 
          />
        )}
      </div>
    </div>
  );
}