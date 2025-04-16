'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Submission } from '@/types/submission';
import { getSubmissionById, getMockSubmissions } from '@/lib/api';

export function useSubmissionDetail(id: number) {
  // Force use of real API data
  console.log('Detail hook - Current environment:', process.env.NEXT_PUBLIC_APP_ENV);
  const useMockData = false; // Force real API data
  
  const { data, isLoading, error } = useQuery<Submission>({
    queryKey: ['submission', id],
    queryFn: async () => {
      if (useMockData) {
        const submissions = await getMockSubmissions();
        const submission = submissions.find(sub => sub.id === id);
        
        if (!submission) {
          throw new Error(`Submission with ID ${id} not found`);
        }
        
        return submission;
      } else {
        return getSubmissionById(id);
      }
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