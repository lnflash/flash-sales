import React from 'react';
import { Country } from '@/types/territory';
import { CountryMetrics } from '@/types/territory-analytics';
import { getCurrencySymbol } from '@/types/territory';
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  UserGroupIcon,
  MapPinIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

interface CountryGridProps {
  countries: Country[];
  metrics?: CountryMetrics[];
  onCountryClick: (countryCode: string) => void;
  selectedCountry?: string;
  groupByTier?: boolean;
}

export default function CountryGrid({
  countries,
  metrics = [],
  onCountryClick,
  selectedCountry,
  groupByTier = true
}: CountryGridProps) {
  // Group countries by tier
  const groupedCountries = groupByTier ? {
    'Major Markets': countries.slice(0, 6),
    'Growing Markets': countries.slice(6, 9),
    'Emerging Markets': countries.slice(9)
  } : { 'All Countries': countries };

  const getCountryMetrics = (countryCode: string) => {
    return metrics.find(m => m.countryCode === countryCode);
  };

  const renderCountryCard = (country: Country) => {
    const countryMetrics = getCountryMetrics(country.code);
    const isSelected = selectedCountry === country.code;
    
    return (
      <div
        key={country.code}
        onClick={() => onCountryClick(country.code)}
        className={`
          relative p-6 rounded-xl border-2 transition-all cursor-pointer
          ${isSelected
            ? 'border-primary bg-primary/5 shadow-lg scale-105'
            : 'border-border hover:border-primary/50 hover:shadow-md hover:scale-102'
          }
        `}
      >
        {/* Country Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-4xl">{country.flagEmoji}</span>
            <div>
              <h3 className="font-semibold text-lg text-foreground">
                {country.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {country.code} · {getCurrencySymbol(country.currencyCode)}
              </p>
            </div>
          </div>
        </div>

        {/* Metrics */}
        {countryMetrics ? (
          <div className="space-y-3">
            {/* Key Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <ChartBarIcon className="w-3 h-3" />
                  Total Leads
                </div>
                <p className="font-semibold text-lg">
                  {countryMetrics.totalLeads.toLocaleString()}
                </p>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                  <ArrowTrendingUpIcon className="w-3 h-3" />
                  Conversion
                </div>
                <p className="font-semibold text-lg">
                  {countryMetrics.avgConversionRate.toFixed(1)}%
                </p>
              </div>
            </div>

            {/* Secondary Metrics */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPinIcon className="w-3 h-3" />
                <span>{countryMetrics.totalTerritories} territories</span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <UserGroupIcon className="w-3 h-3" />
                <span>{countryMetrics.totalReps} reps</span>
              </div>
            </div>

            {/* Activity Indicator */}
            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Today</span>
                <div className="flex items-center gap-3">
                  <span className="text-green-600">
                    +{countryMetrics.recentActivity.newLeadsToday} leads
                  </span>
                  {countryMetrics.recentActivity.conversionsToday > 0 && (
                    <span className="text-blue-600">
                      {countryMetrics.recentActivity.conversionsToday} won
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3 animate-pulse">
              <div className="h-4 w-20 bg-muted rounded mb-1"></div>
              <div className="h-6 w-16 bg-muted rounded"></div>
            </div>
            <div className="text-sm text-muted-foreground">
              No data available
            </div>
          </div>
        )}

        {/* Selected Indicator */}
        {isSelected && (
          <div className="absolute top-2 right-2 w-3 h-3 bg-primary rounded-full animate-pulse"></div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {Object.entries(groupedCountries).map(([tierName, tierCountries]) => (
        <div key={tierName}>
          {groupByTier && (
            <h3 className="text-lg font-semibold text-foreground mb-4">
              {tierName}
            </h3>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {tierCountries.map(renderCountryCard)}
          </div>
        </div>
      ))}
    </div>
  );
}