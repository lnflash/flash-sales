import React from 'react';
import { Country } from '@/types/territory';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface CountrySelectorProps {
  value?: string;
  countries: Country[];
  selectedCountry?: string;
  onChange: (countryCode: string) => void;
  showAll?: boolean;
  className?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  countries,
  selectedCountry,
  onChange,
  showAll = true,
  className = ''
}) => {
  const currentValue = value || selectedCountry || '';
  
  return (
    <div className={`relative ${className}`}>
      <select
        value={currentValue}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-10 text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
      >
        {showAll && (
          <option value="">All Countries</option>
        )}
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.flagEmoji} {country.name}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
    </div>
  );
};

// Compact version for use in headers
export const CountryToggle: React.FC<CountrySelectorProps> = ({
  countries,
  selectedCountry,
  onChange,
  className = ''
}) => {
  const selected = countries.find(c => c.code === selectedCountry);
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {countries.map((country) => (
        <button
          key={country.code}
          onClick={() => onChange(country.code)}
          className={`
            px-3 py-1.5 rounded-lg font-medium transition-all
            ${selectedCountry === country.code
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-foreground'
            }
          `}
          title={country.name}
        >
          <span className="text-lg mr-1.5">{country.flagEmoji}</span>
          <span className="hidden sm:inline">{country.name}</span>
          <span className="sm:hidden">{country.code}</span>
        </button>
      ))}
    </div>
  );
};

// Visual country grid for dashboard
export const CountryGrid: React.FC<{
  countries: Country[];
  selectedCountry?: string;
  onCountryClick: (countryCode: string) => void;
  showStats?: boolean;
  stats?: Record<string, { leads: number; reps: number; conversion: number }>;
}> = ({ countries, selectedCountry, onCountryClick, showStats = false, stats = {} }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {countries.map((country) => {
        const countryStats = stats[country.code];
        const isSelected = selectedCountry === country.code;
        
        return (
          <button
            key={country.code}
            onClick={() => onCountryClick(country.code)}
            className={`
              p-6 rounded-xl border-2 transition-all text-left
              ${isSelected
                ? 'border-primary bg-primary/10 shadow-lg'
                : 'border-border hover:border-primary/50 hover:shadow-md'
              }
            `}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-4xl mb-2">{country.flagEmoji}</div>
                <h3 className="text-lg font-semibold text-foreground">
                  {country.name}
                </h3>
                {country.localName && country.localName !== country.name && (
                  <p className="text-sm text-muted-foreground">{country.localName}</p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">{country.code}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {country.currencyCode}
                </div>
              </div>
            </div>
            
            {showStats && countryStats && (
              <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {countryStats.leads}
                  </div>
                  <div className="text-xs text-muted-foreground">Leads</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {countryStats.reps}
                  </div>
                  <div className="text-xs text-muted-foreground">Reps</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {countryStats.conversion}%
                  </div>
                  <div className="text-xs text-muted-foreground">Conv.</div>
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap gap-1 mt-4">
              {country.languages.map((lang) => (
                <span
                  key={lang}
                  className="px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground uppercase"
                >
                  {lang}
                </span>
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
};