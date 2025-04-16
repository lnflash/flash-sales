'use client';

import { useQuery } from '@tanstack/react-query';
import { SubmissionStats } from '@/types/submission';
import { getSubmissionStats, getMockSubmissionStats } from '@/lib/api';

export function useSubmissionStats() {
  // Always use real data in production, and only use mock data in development
  const useMockData = process.env.NEXT_PUBLIC_APP_ENV === 'development';
  
  const { data, isLoading, error, refetch } = useQuery<SubmissionStats>({
    queryKey: ['submissionStats'],
    queryFn: async () => {
      if (useMockData) {
        return getMockSubmissionStats();
      } else {
        return getSubmissionStats();
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  return {
    stats: data,
    isLoading,
    error,
    refetch,
  };
}