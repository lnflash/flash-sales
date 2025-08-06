import React, { useState } from 'react';
import { 
  FunnelIcon,
  CalendarIcon,
  UserIcon,
  MapPinIcon,
  ChartBarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Button } from './button';

export interface FilterState {
  status?: string[];
  dateRange?: 'today' | 'week' | 'month' | 'all';
  assignedTo?: string[];
  territory?: string[];
  interestLevel?: number[];
}

interface QuickFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableUsers?: string[];
  availableTerritories?: string[];
}

export const QuickFilters: React.FC<QuickFiltersProps> = ({
  filters,
  onFiltersChange,
  availableUsers = [],
  availableTerritories = []
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const statusOptions = [
    { value: 'new', label: 'Canvas', color: 'bg-gray-100 text-gray-800' },
    { value: 'contacted', label: 'Contacted', color: 'bg-blue-100 text-blue-800' },
    { value: 'qualified', label: 'Prospect', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'qualified', label: 'Opportunity', color: 'bg-purple-100 text-purple-800' },
    { value: 'converted', label: 'Signed Up', color: 'bg-green-100 text-green-800' }
  ];

  const dateRangeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'all', label: 'All Time' }
  ];

  const handleStatusToggle = (status: string) => {
    const currentStatuses = filters.status || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    onFiltersChange({ ...filters, status: newStatuses.length > 0 ? newStatuses : undefined });
  };

  const handleDateRangeChange = (range: string) => {
    onFiltersChange({ 
      ...filters, 
      dateRange: filters.dateRange === range ? undefined : range as FilterState['dateRange']
    });
  };

  const handleClearFilters = () => {
    onFiltersChange({});
    setShowAdvanced(false);
  };

  const activeFiltersCount = Object.keys(filters).filter(key => filters[key as keyof FilterState]).length;

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Quick Filters</h3>
          {activeFiltersCount > 0 && (
            <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
              {activeFiltersCount} active
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="text-sm"
            >
              Clear all
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </Button>
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {statusOptions.map(option => (
          <button
            key={option.value}
            onClick={() => handleStatusToggle(option.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              filters.status?.includes(option.value)
                ? option.color
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Date Range Filters */}
      <div className="flex items-center gap-2 mb-4">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-2">
          {dateRangeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => handleDateRangeChange(option.value)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                filters.dateRange === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="border-t border-border pt-4 mt-4 space-y-4">
          {/* Assigned To Filter */}
          {availableUsers.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <UserIcon className="h-4 w-4" />
                Assigned To
              </label>
              <div className="flex flex-wrap gap-2">
                {availableUsers.map(user => (
                  <button
                    key={user}
                    onClick={() => {
                      const current = filters.assignedTo || [];
                      const newUsers = current.includes(user)
                        ? current.filter(u => u !== user)
                        : [...current, user];
                      onFiltersChange({ 
                        ...filters, 
                        assignedTo: newUsers.length > 0 ? newUsers : undefined 
                      });
                    }}
                    className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                      filters.assignedTo?.includes(user)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {user}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Territory Filter */}
          {availableTerritories.length > 0 && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <MapPinIcon className="h-4 w-4" />
                Territory
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTerritories.map(territory => (
                  <button
                    key={territory}
                    onClick={() => {
                      const current = filters.territory || [];
                      const newTerritories = current.includes(territory)
                        ? current.filter(t => t !== territory)
                        : [...current, territory];
                      onFiltersChange({ 
                        ...filters, 
                        territory: newTerritories.length > 0 ? newTerritories : undefined 
                      });
                    }}
                    className={`px-3 py-1.5 rounded-md text-sm transition-all ${
                      filters.territory?.includes(territory)
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                  >
                    {territory}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Interest Level Filter */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
              <ChartBarIcon className="h-4 w-4" />
              Interest Level
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  onClick={() => {
                    const current = filters.interestLevel || [];
                    const newLevels = current.includes(level)
                      ? current.filter(l => l !== level)
                      : [...current, level];
                    onFiltersChange({ 
                      ...filters, 
                      interestLevel: newLevels.length > 0 ? newLevels : undefined 
                    });
                  }}
                  className={`w-10 h-10 rounded-md text-sm font-medium transition-all ${
                    filters.interestLevel?.includes(level)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};