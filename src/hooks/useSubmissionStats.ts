'use client';

import { useQuery } from '@tanstack/react-query';
import { SubmissionStats } from '@/types/submission';
import { getSubmissionStats } from '@/lib/api';

export function useSubmissionStats() {
  const { data, isLoading, error, refetch } = useQuery<SubmissionStats>({
    queryKey: ['submissionStats'],
    queryFn: async () => {
      return getSubmissionStats();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 3,
  });
  
  return {
    stats: data,
    isLoading,
    error,
    refetch,
  };
}