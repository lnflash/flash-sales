'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Submission, 
  SubmissionFilters, 
  PaginationState, 
  SortOption 
} from '@/types/submission';
import { getSubmissions } from '@/lib/api';

export function useSubmissions(
  initialFilters: SubmissionFilters = {},
  initialPagination: PaginationState = { pageIndex: 0, pageSize: 25 },
  initialSorting: SortOption[] = [{ id: 'timestamp', desc: true }]
) {
  const [filters, setFilters] = useState<SubmissionFilters>(initialFilters);
  const [pagination, setPagination] = useState<PaginationState>(initialPagination);
  const [sorting, setSorting] = useState<SortOption[]>(initialSorting);
  
  // Always use real API data
  console.log('Current environment:', process.env.NEXT_PUBLIC_APP_ENV, 'NODE_ENV:', process.env.NODE_ENV);
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['submissions', filters, pagination, sorting],
    queryFn: async () => {
      // Use real API data
      return getSubmissions(filters, pagination, sorting);
    },
    staleTime: 1000 * 60, // 1 minute
  });
  
  const handleFilterChange = (newFilters: SubmissionFilters) => {
    // Reset to the first page when filters change
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
    setFilters(newFilters);
  };
  
  const resetFilters = () => {
    setFilters({});
    setPagination(initialPagination);
  };
  
  // Apply initial filters only once
  useEffect(() => {
    setFilters(initialFilters);
  }, []);
  
  return {
    submissions: data?.data || [],
    totalCount: data?.totalCount || 0,
    pageCount: data?.pageCount || 0,
    isLoading,
    error,
    filters,
    pagination,
    sorting,
    setFilters: handleFilterChange,
    setPagination,
    setSorting,
    resetFilters,
    refetch,
  };
}