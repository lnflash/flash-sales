// Territory Analytics Types
export interface TerritoryMetrics {
  territoryId: string;
  territoryName: string;
  territoryType: string;
  countryCode: string;
  countryName: string;
  parentTerritoryId?: string;
  parentTerritoryName?: string;
  totalLeads: number;
  activeLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgDealSize: number;
  avgTimeToClose: number; // in days
  assignedReps: number;
  lastActivityDate?: Date;
  lastUpdated: Date;
}

export interface CountryMetrics {
  countryCode: string;
  countryName: string;
  flagEmoji: string;
  currencyCode: string;
  totalTerritories: number;
  totalLeads: number;
  activeLeads: number;
  totalRevenue: number;
  avgConversionRate: number;
  avgTimeToClose: number;
  totalReps: number;
  topPerformingTerritories: TerritoryMetrics[];
  underperformingTerritories: TerritoryMetrics[];
  recentActivity: {
    newLeadsToday: number;
    conversionsToday: number;
    activitiesLogged: number;
  };
}

export interface TerritoryComparison {
  territoryA: TerritoryMetrics;
  territoryB: TerritoryMetrics;
  metrics: {
    conversionRateDiff: number;
    avgDealSizeDiff: number;
    timeToCloseDiff: number;
    leadVolumeDiff: number;
  };
}

export interface TerritoryTrend {
  territoryId: string;
  date: string;
  leads: number;
  conversions: number;
  revenue: number;
  activities: number;
}

export interface RepTerritoryPerformance {
  repId: string;
  repName: string;
  territories: {
    territoryId: string;
    territoryName: string;
    countryCode: string;
    metrics: {
      leads: number;
      conversions: number;
      conversionRate: number;
      revenue: number;
    };
  }[];
  totalLeads: number;
  totalConversions: number;
  overallConversionRate: number;
  totalRevenue: number;
}

export interface TerritoryHeatMapData {
  territoryId: string;
  name: string;
  value: number; // normalized performance score 0-100
  actualValue: number; // actual metric value
  color: string; // hex color based on performance
  details: {
    leads: number;
    conversions: number;
    revenue: number;
  };
}

export type MetricType = 
  | 'leads'
  | 'conversions' 
  | 'conversionRate'
  | 'revenue'
  | 'avgDealSize'
  | 'timeToClose';

export interface TerritoryReportConfig {
  title: string;
  dateRange: {
    start: Date;
    end: Date;
  };
  countries: string[];
  territories: string[];
  metrics: MetricType[];
  groupBy: 'country' | 'territory' | 'rep' | 'week' | 'month';
  includeCharts: boolean;
  includeTrends: boolean;
  format: 'csv' | 'pdf' | 'excel';
}