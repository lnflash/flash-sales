import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { CountryMetrics } from '@/types/territory-analytics';

interface CountryComparisonChartProps {
  countries: CountryMetrics[];
  metric: 'conversionRate' | 'leads' | 'revenue';
  height?: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function CountryComparisonChart({
  countries,
  metric,
  height = 300
}: CountryComparisonChartProps) {
  // Prepare data for the chart
  const chartData = countries.map((country, index) => {
    let value = 0;
    let label = '';
    
    switch (metric) {
      case 'conversionRate':
        value = country.avgConversionRate;
        label = 'Conversion Rate (%)';
        break;
      case 'leads':
        value = country.totalLeads;
        label = 'Total Leads';
        break;
      case 'revenue':
        value = country.totalRevenue;
        label = 'Revenue';
        break;
    }
    
    return {
      name: `${country.flagEmoji} ${country.countryName}`,
      country: country.countryName,
      value: value,
      activeLeads: country.activeLeads,
      territories: country.totalTerritories,
      reps: country.totalReps,
      color: COLORS[index % COLORS.length]
    };
  });

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg shadow-lg p-4">
          <p className="font-semibold text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">
                {metric === 'conversionRate' ? 'Conversion Rate' : 
                 metric === 'leads' ? 'Total Leads' : 'Revenue'}:
              </span>
              <span className="font-medium">
                {metric === 'conversionRate' ? `${data.value.toFixed(1)}%` :
                 metric === 'revenue' ? `$${data.value.toLocaleString()}` :
                 data.value.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Active Leads:</span>
              <span className="font-medium">{data.activeLeads}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Territories:</span>
              <span className="font-medium">{data.territories}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Sales Reps:</span>
              <span className="font-medium">{data.reps}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Get Y-axis label
  const getYAxisLabel = () => {
    switch (metric) {
      case 'conversionRate':
        return 'Conversion Rate (%)';
      case 'leads':
        return 'Number of Leads';
      case 'revenue':
        return 'Revenue ($)';
      default:
        return '';
    }
  };

  // Format Y-axis tick
  const formatYAxisTick = (value: number) => {
    if (metric === 'revenue') {
      return `$${(value / 1000).toFixed(0)}k`;
    }
    if (metric === 'conversionRate') {
      return `${value}%`;
    }
    return value.toLocaleString();
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis 
          dataKey="name" 
          tick={{ fill: 'currentColor' }}
          className="text-muted-foreground"
        />
        <YAxis 
          tick={{ fill: 'currentColor' }}
          className="text-muted-foreground"
          label={{ 
            value: getYAxisLabel(), 
            angle: -90, 
            position: 'insideLeft',
            style: { textAnchor: 'middle', fill: 'currentColor' }
          }}
          tickFormatter={formatYAxisTick}
        />
        <Tooltip 
          content={<CustomTooltip />}
          cursor={{ fill: 'transparent' }}
        />
        <Bar 
          dataKey="value" 
          radius={[8, 8, 0, 0]}
          animationDuration={1000}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}