import React from 'react';

export const PerformanceChartWidget: React.FC = () => {
  // Mock data
  const data = [
    { month: 'Jan', leads: 45, conversions: 12 },
    { month: 'Feb', leads: 52, conversions: 15 },
    { month: 'Mar', leads: 48, conversions: 18 },
    { month: 'Apr', leads: 61, conversions: 22 },
    { month: 'May', leads: 65, conversions: 28 },
    { month: 'Jun', leads: 72, conversions: 32 }
  ];

  const maxValue = Math.max(...data.map(d => Math.max(d.leads, d.conversions)));

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">Leads</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">Conversions</span>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex items-end gap-2">
        {data.map((item, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-2">
            <div className="relative w-full flex gap-1">
              <div className="flex-1 bg-blue-500 rounded-t-sm transition-all duration-300"
                style={{ height: `${(item.leads / maxValue) * 150}px` }}
                title={`${item.leads} leads`}
              />
              <div className="flex-1 bg-green-500 rounded-t-sm transition-all duration-300"
                style={{ height: `${(item.conversions / maxValue) * 150}px` }}
                title={`${item.conversions} conversions`}
              />
            </div>
            <span className="text-xs text-muted-foreground">{item.month}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Conversion Rate</span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            {Math.round((data[data.length - 1].conversions / data[data.length - 1].leads) * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};