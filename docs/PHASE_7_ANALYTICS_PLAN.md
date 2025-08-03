# Phase 7: Analytics and Reporting by Country/Territory

## Overview
Enhance the analytics capabilities to provide insights by country and territory, enabling better decision-making for Caribbean-wide operations.

## Key Components

### 1. Territory Analytics Dashboard
- **Component**: `TerritoryAnalyticsDashboard.tsx`
- **Features**:
  - Country performance overview cards
  - Territory heat map visualization
  - Lead conversion rates by territory
  - Sales rep performance by assigned territories
  - Time-based trend analysis

### 2. Country Comparison View
- **Component**: `CountryComparisonChart.tsx`
- **Features**:
  - Side-by-side country metrics
  - Key performance indicators (KPIs) per country
  - Currency-adjusted revenue calculations
  - Language preference insights

### 3. Territory Performance Metrics
- **Component**: `TerritoryPerformanceCard.tsx`
- **Metrics**:
  - Total leads per territory
  - Conversion rates
  - Average deal size
  - Time to close
  - Active vs. inactive leads
  - Sales rep coverage

### 4. Enhanced Analytics API
- **Updates to**: Analytics page and API endpoints
- **New Queries**:
  - Leads by country/territory
  - Performance by territory hierarchy
  - Cross-country comparisons
  - Territory assignment effectiveness

### 5. Export and Reporting
- **Component**: `TerritoryReportExporter.tsx`
- **Features**:
  - Export to CSV/PDF
  - Customizable report templates
  - Scheduled report generation
  - Email report distribution

## Implementation Steps

### Step 1: Create Territory Analytics Types
```typescript
interface TerritoryMetrics {
  territoryId: string;
  territoryName: string;
  countryCode: string;
  totalLeads: number;
  activeLeads: number;
  convertedLeads: number;
  conversionRate: number;
  avgDealSize: number;
  avgTimeToClose: number;
  assignedReps: number;
  lastUpdated: Date;
}

interface CountryMetrics {
  countryCode: string;
  countryName: string;
  totalTerritories: number;
  totalLeads: number;
  totalRevenue: number;
  avgConversionRate: number;
  topPerformingTerritories: TerritoryMetrics[];
  underperformingTerritories: TerritoryMetrics[];
}
```

### Step 2: Update Analytics Queries
- Add territory joins to existing queries
- Create new aggregation functions
- Implement caching for performance

### Step 3: Build Visualization Components
- Territory heat map using D3.js or Recharts
- Country comparison charts
- Performance trend lines

### Step 4: Integrate with Existing Analytics
- Update the main analytics page
- Add territory filters
- Ensure backward compatibility

### Step 5: Add Export Functionality
- CSV export with territory data
- PDF reports with charts
- Scheduled report automation

## Testing Requirements
1. Unit tests for analytics calculations
2. Integration tests for data aggregation
3. Performance tests for large datasets
4. Visual regression tests for charts

## Success Criteria
- [ ] Territory-based filtering on analytics page
- [ ] Country comparison view functional
- [ ] Heat map showing territory performance
- [ ] Export functionality for all reports
- [ ] Performance metrics load under 3 seconds
- [ ] Mobile-responsive analytics views

## Migration Considerations
- Ensure historical data is properly tagged with territories
- Handle legacy Jamaica-only data
- Provide fallbacks for missing territory data