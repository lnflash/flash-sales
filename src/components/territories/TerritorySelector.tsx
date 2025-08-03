import React, { useState, useEffect } from 'react';
import { Territory, Country, formatTerritoryPath } from '@/types/territory';
import { ChevronDownIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';

interface TerritorySelectorProps {
  value?: string | string[];
  onChange: (value: string | string[]) => void;
  countryCode?: string;
  multiple?: boolean;
  showCountryInName?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLevel?: number;
  includeInactive?: boolean;
}

export const TerritorySelector: React.FC<TerritorySelectorProps> = ({
  value,
  onChange,
  countryCode,
  multiple = false,
  showCountryInName = false,
  placeholder = 'Select territory...',
  className = '',
  disabled = false,
  maxLevel,
  includeInactive = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fetch territories based on country
  const { data: territories = [], isLoading } = useQuery({
    queryKey: ['territories', countryCode, maxLevel, includeInactive],
    queryFn: async () => {
      let query = supabase
        .from('territory_hierarchy')
        .select('*')
        .order('level')
        .order('name');
      
      if (countryCode) {
        query = query.eq('country_code', countryCode);
      }
      
      if (maxLevel) {
        query = query.lte('level', maxLevel);
      }
      
      if (!includeInactive) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching territories:', error);
        return [];
      }
      
      return data as Territory[];
    },
    staleTime: 5 * 60 * 1000 // Cache for 5 minutes
  });
  
  // Filter territories based on search
  const filteredTerritories = territories.filter(territory => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      territory.name.toLowerCase().includes(search) ||
      territory.localName?.toLowerCase().includes(search) ||
      territory.fullPath?.toLowerCase().includes(search)
    );
  });
  
  // Group territories by level for better display
  const groupedTerritories = filteredTerritories.reduce((acc, territory) => {
    const level = territory.level;
    if (!acc[level]) {
      acc[level] = [];
    }
    acc[level].push(territory);
    return acc;
  }, {} as Record<number, Territory[]>);
  
  // Get selected territories
  const selectedTerritories = territories.filter(t => {
    if (multiple && Array.isArray(value)) {
      return value.includes(t.id);
    }
    return value === t.id;
  });
  
  const handleSelect = (territoryId: string) => {
    if (multiple && Array.isArray(value)) {
      const newValue = value.includes(territoryId)
        ? value.filter(id => id !== territoryId)
        : [...value, territoryId];
      onChange(newValue);
    } else {
      onChange(territoryId);
      setIsOpen(false);
    }
  };
  
  const displayValue = () => {
    if (selectedTerritories.length === 0) {
      return placeholder;
    }
    
    if (multiple) {
      return `${selectedTerritories.length} territories selected`;
    }
    
    const territory = selectedTerritories[0];
    return showCountryInName ? formatTerritoryPath(territory) : territory.name;
  };
  
  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full flex items-center justify-between
          px-4 py-2 rounded-lg border
          ${disabled
            ? 'bg-muted border-border cursor-not-allowed opacity-50'
            : 'bg-background border-border hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary'
          }
        `}
      >
        <span className="flex items-center gap-2">
          <MapPinIcon className="w-4 h-4 text-muted-foreground" />
          <span className={selectedTerritories.length === 0 ? 'text-muted-foreground' : ''}>
            {displayValue()}
          </span>
        </span>
        <ChevronDownIcon className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && !disabled && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-2 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-border">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search territories..."
                className="w-full px-3 py-1.5 bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* Territory list */}
            <div className="max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">
                  Loading territories...
                </div>
              ) : filteredTerritories.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No territories found
                </div>
              ) : (
                Object.entries(groupedTerritories).map(([level, territories]) => (
                  <div key={level}>
                    <div className="px-3 py-1.5 bg-muted text-xs font-medium text-muted-foreground sticky top-0">
                      Level {level} Territories
                    </div>
                    {territories.map((territory) => {
                      const isSelected = multiple && Array.isArray(value)
                        ? value.includes(territory.id)
                        : value === territory.id;
                      
                      return (
                        <button
                          key={territory.id}
                          onClick={() => handleSelect(territory.id)}
                          className={`
                            w-full text-left px-4 py-2 hover:bg-accent transition-colors
                            ${isSelected ? 'bg-primary/10' : ''}
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">
                                {territory.flagEmoji} {territory.name}
                              </div>
                              {territory.fullPath && territory.fullPath !== territory.name && (
                                <div className="text-xs text-muted-foreground">
                                  {territory.fullPath}
                                </div>
                              )}
                            </div>
                            {multiple && (
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => {}}
                                className="h-4 w-4 text-primary"
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
            
            {multiple && selectedTerritories.length > 0 && (
              <div className="p-2 border-t border-border">
                <button
                  onClick={() => {
                    onChange([]);
                    setIsOpen(false);
                  }}
                  className="w-full px-3 py-1.5 text-sm text-destructive hover:bg-destructive/10 rounded transition-colors"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// Simplified version for single territory selection
export const SimpleTerritorySelect: React.FC<{
  value?: string;
  onChange: (value: string) => void;
  countryCode: string;
  territories: string[];
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, countryCode, territories, placeholder = 'Select...', className = '' }) => {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className={`
        w-full px-3 py-2 bg-background border border-border rounded-lg
        focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent
        ${className}
      `}
    >
      <option value="">{placeholder}</option>
      {territories.map((territory) => (
        <option key={territory} value={territory}>
          {territory}
        </option>
      ))}
    </select>
  );
};