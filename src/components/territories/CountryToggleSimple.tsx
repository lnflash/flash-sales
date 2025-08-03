import React from 'react';

interface CountryToggleSimpleProps {
  countries: Array<{ code: string; name: string; flagEmoji: string }>;
  selectedCountry: string;
  onChange: (code: string) => void;
  showAll?: boolean;
}

export const CountryToggleSimple: React.FC<CountryToggleSimpleProps> = ({
  countries,
  selectedCountry,
  onChange,
  showAll = false
}) => {
  return (
    <div className="flex items-center gap-2">
      {showAll && (
        <button
          onClick={() => onChange('')}
          className={`
            px-3 py-1.5 rounded-lg font-medium transition-all
            ${!selectedCountry
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-foreground'
            }
          `}
        >
          All Countries
        </button>
      )}
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