'use client';

import { useQuery } from '@tanstack/react-query';
import { SubmissionStats } from '@/types/submission';
import { getSubmissionStats, getMockSubmissionStats } from '@/lib/api';

export function useSubmissionStats() {
  // For development, we'll use mock data
  const useMockData = process.env.NEXT_PUBLIC_APP_ENV !== 'production';
  
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