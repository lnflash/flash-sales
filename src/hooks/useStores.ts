// Convenience hooks for using stores in components
import { useAppStore } from '@/stores/useAppStore';
import { useSalesStore } from '@/stores/useSalesStore';
import { useAuthStore } from '@/stores/useAuthStore';

// Example of selector hooks for performance optimization
export const useTheme = () => useAppStore((state) => state.preferences.theme);
export const useSidebarCollapsed = () => useAppStore((state) => state.ui.sidebarCollapsed);
export const useNotifications = () => useAppStore((state) => state.notifications);

export const useRecentDeals = () => useSalesStore((state) => state.recentDeals);
export const useSalesStats = () => useSalesStore((state) => state.stats);

export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);

// Composite hooks
export function useUserPreferences() {
  const preferences = useAppStore((state) => state.preferences);
  const setPreferences = useAppStore((state) => state.setPreferences);
  
  return {
    ...preferences,
    update: setPreferences,
  };
}

export function useDashboardFilters() {
  const filters = useAppStore((state) => state.ui.filters);
  const setFilters = useAppStore((state) => state.setFilters);
  
  return {
    filters,
    setDateRange: (start: Date | null, end: Date | null) => 
      setFilters({ dateRange: { start, end } }),
    setSalesRep: (salesRep: string | null) => 
      setFilters({ salesRep }),
    setStatus: (status: string | null) => 
      setFilters({ status }),
    reset: () => 
      setFilters({ 
        dateRange: { start: null, end: null }, 
        salesRep: null, 
        status: null 
      }),
  };
}