import { useMemo } from 'react';
import { FilterState } from '@/components/ui/quick-filters';

export function useFilteredData<T extends Record<string, any>>(
  data: T[],
  filters: FilterState,
  config: {
    statusField?: string;
    dateField?: string;
    assignedToField?: string;
    territoryField?: string;
    interestLevelField?: string;
  } = {}
) {
  const {
    statusField = 'leadStatus',
    dateField = 'timestamp',
    assignedToField = 'assignedTo',
    territoryField = 'territory',
    interestLevelField = 'interestLevel'
  } = config;

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Status filter
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(item[statusField])) {
          return false;
        }
      }

      // Date range filter
      if (filters.dateRange && item[dateField]) {
        const itemDate = new Date(item[dateField]);
        const now = new Date();
        
        switch (filters.dateRange) {
          case 'today':
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (itemDate < today) return false;
            break;
          
          case 'week':
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            if (itemDate < weekAgo) return false;
            break;
          
          case 'month':
            const monthAgo = new Date();
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            if (itemDate < monthAgo) return false;
            break;
        }
      }

      // Assigned to filter
      if (filters.assignedTo && filters.assignedTo.length > 0) {
        if (!filters.assignedTo.includes(item[assignedToField])) {
          return false;
        }
      }

      // Territory filter
      if (filters.territory && filters.territory.length > 0) {
        if (!filters.territory.includes(item[territoryField])) {
          return false;
        }
      }

      // Interest level filter
      if (filters.interestLevel && filters.interestLevel.length > 0) {
        if (!filters.interestLevel.includes(item[interestLevelField])) {
          return false;
        }
      }

      return true;
    });
  }, [data, filters, statusField, dateField, assignedToField, territoryField, interestLevelField]);

  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const users = new Set<string>();
    const territories = new Set<string>();

    data.forEach(item => {
      if (item[assignedToField]) users.add(item[assignedToField]);
      if (item[territoryField]) territories.add(item[territoryField]);
    });

    return {
      availableUsers: Array.from(users).sort(),
      availableTerritories: Array.from(territories).sort()
    };
  }, [data, assignedToField, territoryField]);

  return {
    filteredData,
    ...filterOptions
  };
}