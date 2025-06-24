import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { RepWeeklyData, RepTrackingFormData, RepPerformanceStats, RepTrackingFilters } from '../types/rep-tracking';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

export function useRepTracking(filters?: RepTrackingFilters) {
  return useQuery({
    queryKey: ['repTracking', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters?.repName) params.append('repName', filters.repName);
      if (filters?.startDate) params.append('startDate', filters.startDate);
      if (filters?.endDate) params.append('endDate', filters.endDate);
      
      const response = await fetch(`${API_BASE_URL}/rep-tracking?${params}`);
      if (!response.ok) throw new Error('Failed to fetch rep tracking data');
      return response.json() as Promise<RepWeeklyData[]>;
    }
  });
}

export function useRepPerformanceStats() {
  return useQuery({
    queryKey: ['repPerformanceStats'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE_URL}/rep-tracking/stats`);
      if (!response.ok) throw new Error('Failed to fetch rep performance stats');
      return response.json() as Promise<RepPerformanceStats[]>;
    }
  });
}

export function useCreateRepTracking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: RepTrackingFormData) => {
      const response = await fetch(`${API_BASE_URL}/rep-tracking`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) throw new Error('Failed to save rep tracking data');
      return response.json() as Promise<RepWeeklyData>;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['repTracking'] });
      queryClient.invalidateQueries({ queryKey: ['repPerformanceStats'] });
    },
  });
}