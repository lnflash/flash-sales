import React from 'react';
import { TerritoryMetrics } from '@/types/territory-analytics';

interface TerritoryHeatMapProps {
  territories: TerritoryMetrics[];
  metric: 'conversionRate' | 'leads' | 'revenue';
  countryCode: string;
}

export default function TerritoryHeatMap({
  territories,
  metric,
  countryCode
}: TerritoryHeatMapProps) {
  // Calculate min and max values for the metric
  const getMetricValue = (territory: TerritoryMetrics) => {
    switch (metric) {
      case 'conversionRate':
        return territory.conversionRate;
      case 'leads':
        return territory.totalLeads;
      case 'revenue':
        return 0; // TODO: Implement when revenue is tracked
      default:
        return 0;
    }
  };

  const values = territories.map(getMetricValue);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  // Get color based on performance
  const getColor = (value: number) => {
    const normalized = (value - minValue) / range;
    
    if (normalized < 0.2) return 'bg-red-500 text-white';
    if (normalized < 0.4) return 'bg-orange-500 text-white';
    if (normalized < 0.6) return 'bg-yellow-500 text-white';
    if (normalized < 0.8) return 'bg-green-500 text-white';
    return 'bg-green-600 text-white';
  };

  const getColorHex = (value: number) => {
    const normalized = (value - minValue) / range;
    
    if (normalized < 0.2) return '#ef4444';
    if (normalized < 0.4) return '#f97316';
    if (normalized < 0.6) return '#eab308';
    if (normalized < 0.8) return '#22c55e';
    return '#16a34a';
  };

  // Group territories by parent (if applicable)
  const groupedTerritories = territories.reduce((acc, territory) => {
    const parent = territory.parentTerritoryName || 'Main Districts';
    if (!acc[parent]) {
      acc[parent] = [];
    }
    acc[parent].push(territory);
    return acc;
  }, {} as Record<string, TerritoryMetrics[]>);

  const formatValue = (territory: TerritoryMetrics) => {
    const value = getMetricValue(territory);
    switch (metric) {
      case 'conversionRate':
        return `${value.toFixed(1)}%`;
      case 'leads':
        return value.toLocaleString();
      case 'revenue':
        return `$${value.toLocaleString()}`;
      default:
        return value;
    }
  };

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {metric === 'conversionRate' && 'Conversion Rate'}
          {metric === 'leads' && 'Lead Volume'}
          {metric === 'revenue' && 'Revenue'}
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Low</span>
          <div className="flex gap-1">
            <div className="w-6 h-6 bg-red-500 rounded"></div>
            <div className="w-6 h-6 bg-orange-500 rounded"></div>
            <div className="w-6 h-6 bg-yellow-500 rounded"></div>
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <div className="w-6 h-6 bg-green-600 rounded"></div>
          </div>
          <span className="text-muted-foreground">High</span>
        </div>
      </div>

      {/* Heat Map Grid */}
      <div className="space-y-4">
        {Object.entries(groupedTerritories).map(([parentName, territories]) => (
          <div key={parentName}>
            {parentName !== 'Main Districts' && (
              <h4 className="text-sm font-medium text-muted-foreground mb-2">{parentName}</h4>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {territories.map((territory) => {
                const value = getMetricValue(territory);
                const color = getColor(value);
                
                return (
                  <div
                    key={territory.territoryId}
                    className={`${color} p-4 rounded-lg text-center cursor-pointer hover:opacity-90 transition-opacity`}
                    title={`${territory.territoryName}: ${formatValue(territory)}`}
                  >
                    <p className="font-semibold text-sm">{territory.territoryName}</p>
                    <p className="text-lg font-bold mt-1">{formatValue(territory)}</p>
                    <div className="text-xs mt-2 opacity-90">
                      <p>{territory.totalLeads} leads</p>
                      <p>{territory.assignedReps} reps</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 pt-6 border-t border-border">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">Best Performing</p>
            <p className="font-semibold text-green-600">
              {territories[0]?.territoryName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatValue(territories[0])}
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Average</p>
            <p className="font-semibold">
              {metric === 'conversionRate' 
                ? `${(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)}%`
                : Math.round(values.reduce((a, b) => a + b, 0) / values.length).toLocaleString()
              }
            </p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Needs Attention</p>
            <p className="font-semibold text-red-600">
              {territories[territories.length - 1]?.territoryName}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatValue(territories[territories.length - 1])}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}