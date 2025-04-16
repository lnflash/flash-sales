'use client';

import { useQuery } from '@tanstack/react-query';
import { Submission } from '@/types/submission';
import { getSubmissionById, getMockSubmissions } from '@/lib/api';

export function useSubmissionDetail(id: number) {
  // Always use real data in production, and only use mock data in development
  const useMockData = process.env.NEXT_PUBLIC_APP_ENV === 'development';
  
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
  
  return {
    submission: data,
    isLoading,
    error,
  };
}