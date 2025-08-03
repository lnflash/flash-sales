import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TerritoryAnalyticsService } from '@/services/territory-analytics';
import { CountryMetrics, TerritoryMetrics } from '@/types/territory-analytics';
import { PROOF_OF_CONCEPT_COUNTRIES } from '@/types/territory';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CountrySelector } from '@/components/territories/CountrySelector';
import TerritoryPerformanceCard from './TerritoryPerformanceCard';
import CountryComparisonChart from './CountryComparisonChart';
import TerritoryHeatMap from './TerritoryHeatMap';
import {
  GlobeAmericasIcon,
  MapPinIcon,
  UserGroupIcon,
  TrendingUpIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { format, subDays } from 'date-fns';

interface TerritoryAnalyticsDashboardProps {
  defaultCountry?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export default function TerritoryAnalyticsDashboard({
  defaultCountry = '',
  dateRange = {
    start: subDays(new Date(), 30),
    end: new Date()
  }
}: TerritoryAnalyticsDashboardProps) {
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [selectedMetric, setSelectedMetric] = useState<'conversionRate' | 'leads' | 'revenue'>('conversionRate');

  // Fetch country metrics
  const { data: countryMetrics, isLoading: loadingCountries } = useQuery({
    queryKey: ['country-metrics', selectedCountry, dateRange],
    queryFn: async () => {
      if (selectedCountry) {
        return TerritoryAnalyticsService.getCountryMetrics(selectedCountry, dateRange);
      }
      
      // Fetch all countries
      const allMetrics = await Promise.all(
        PROOF_OF_CONCEPT_COUNTRIES.map(country => 
          TerritoryAnalyticsService.getCountryMetrics(country.code, dateRange)
        )
      );
      
      return allMetrics.filter(m => m !== null) as CountryMetrics[];
    }
  });

  // Fetch territory comparison data
  const { data: territoryComparison, isLoading: loadingTerritories } = useQuery({
    queryKey: ['territory-comparison', selectedCountry, dateRange],
    queryFn: async () => {
      if (!selectedCountry || !countryMetrics || Array.isArray(countryMetrics)) return null;
      
      const territoryIds = [
        ...countryMetrics.topPerformingTerritories.map(t => t.territoryId),
        ...countryMetrics.underperformingTerritories.map(t => t.territoryId)
      ];
      
      return TerritoryAnalyticsService.compareTerritories(territoryIds, selectedMetric, dateRange);
    },
    enabled: !!selectedCountry && !!countryMetrics && !Array.isArray(countryMetrics)
  });

  const renderMetricCard = (
    title: string, 
    value: string | number, 
    change?: number, 
    icon?: React.ReactNode,
    subtitle?: string
  ) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
          <div className="flex flex-col items-end">
            {icon && (
              <div className="p-2 bg-primary/10 rounded-lg">
                {icon}
              </div>
            )}
            {change !== undefined && (
              <div className={`flex items-center mt-2 text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? <ArrowUpIcon className="w-4 h-4 mr-1" /> : <ArrowDownIcon className="w-4 h-4 mr-1" />}
                {Math.abs(change).toFixed(1)}%
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loadingCountries) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  const singleCountryView = selectedCountry && !Array.isArray(countryMetrics) && countryMetrics;
  const allCountriesView = !selectedCountry && Array.isArray(countryMetrics) && countryMetrics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Territory Analytics</h2>
          <p className="text-muted-foreground mt-1">
            Performance insights by country and territory
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <CountrySelector
            value={selectedCountry}
            onChange={setSelectedCountry}
            countries={PROOF_OF_CONCEPT_COUNTRIES}
            showAll={true}
            className="w-64"
          />
          
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as any)}
            className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
          >
            <option value="conversionRate">Conversion Rate</option>
            <option value="leads">Lead Volume</option>
            <option value="revenue">Revenue</option>
          </select>
        </div>
      </div>

      {/* Single Country View */}
      {singleCountryView && (
        <>
          {/* Country Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {renderMetricCard(
              'Total Leads',
              singleCountryView.totalLeads.toLocaleString(),
              12.5,
              <ChartBarIcon className="w-5 h-5 text-primary" />,
              `${singleCountryView.activeLeads} active`
            )}
            
            {renderMetricCard(
              'Conversion Rate',
              `${singleCountryView.avgConversionRate.toFixed(1)}%`,
              2.3,
              <TrendingUpIcon className="w-5 h-5 text-primary" />,
              'Last 30 days'
            )}
            
            {renderMetricCard(
              'Avg. Time to Close',
              `${singleCountryView.avgTimeToClose.toFixed(0)} days`,
              -5.2,
              <ClockIcon className="w-5 h-5 text-primary" />
            )}
            
            {renderMetricCard(
              'Territory Coverage',
              `${singleCountryView.totalReps} reps`,
              0,
              <UserGroupIcon className="w-5 h-5 text-primary" />,
              `${singleCountryView.totalTerritories} territories`
            )}
          </div>

          {/* Today's Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-primary">
                    {singleCountryView.recentActivity.newLeadsToday}
                  </p>
                  <p className="text-sm text-muted-foreground">New Leads</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {singleCountryView.recentActivity.conversionsToday}
                  </p>
                  <p className="text-sm text-muted-foreground">Conversions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {singleCountryView.recentActivity.activitiesLogged}
                  </p>
                  <p className="text-sm text-muted-foreground">Activities</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Territory Performance */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUpIcon className="w-5 h-5 text-green-600" />
                  Top Performing Territories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {singleCountryView.topPerformingTerritories.map((territory, index) => (
                    <TerritoryPerformanceCard
                      key={territory.territoryId}
                      territory={territory}
                      rank={index + 1}
                      showTrend
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Underperformers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUpIcon className="w-5 h-5 text-red-600 rotate-180" />
                  Territories Needing Attention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {singleCountryView.underperformingTerritories.map((territory, index) => (
                    <TerritoryPerformanceCard
                      key={territory.territoryId}
                      territory={territory}
                      rank={singleCountryView.totalTerritories - index}
                      showTrend
                      isUnderperforming
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Territory Heat Map */}
          {territoryComparison && (
            <Card>
              <CardHeader>
                <CardTitle>Territory Performance Heat Map</CardTitle>
              </CardHeader>
              <CardContent>
                <TerritoryHeatMap
                  territories={territoryComparison}
                  metric={selectedMetric}
                  countryCode={selectedCountry}
                />
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* All Countries View */}
      {allCountriesView && (
        <>
          {/* Country Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Country Performance Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <CountryComparisonChart
                countries={allCountriesView}
                metric={selectedMetric}
                height={400}
              />
            </CardContent>
          </Card>

          {/* Country Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {allCountriesView.map((country) => (
              <Card key={country.countryCode} className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedCountry(country.countryCode)}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className="text-2xl">{country.flagEmoji}</span>
                      {country.countryName}
                    </span>
                    <span className="text-sm font-normal text-muted-foreground">
                      {country.currencyCode}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Leads</p>
                      <p className="text-xl font-semibold">{country.totalLeads.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Conversion</p>
                      <p className="text-xl font-semibold">{country.avgConversionRate.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Territories</p>
                      <p className="text-xl font-semibold">{country.totalTerritories}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Sales Reps</p>
                      <p className="text-xl font-semibold">{country.totalReps}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Today's Activity</p>
                    <div className="flex justify-between text-sm">
                      <span>New: {country.recentActivity.newLeadsToday}</span>
                      <span className="text-green-600">Won: {country.recentActivity.conversionsToday}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}