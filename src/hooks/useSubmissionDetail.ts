'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Submission } from '@/types/submission';
import { getSubmissionById } from '@/lib/api';

export function useSubmissionDetail(id: number) {
  // Always use real API data
  console.log('Detail hook - Current environment:', process.env.NEXT_PUBLIC_APP_ENV);
  
  const { data, isLoading, error } = useQuery<Submission>({
    queryKey: ['submission', id],
    queryFn: async () => {
      return getSubmissionById(id);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  const queryClient = useQueryClient();
  
  const mutate = () => {
    queryClient.invalidateQueries({ queryKey: ['submission', id] });
  };
  
  return {
    submission: data,
    isLoading,
    error,
    mutate,
  };
}