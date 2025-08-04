import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSubmissions } from '@/hooks/useSubmissions';
import { getSubmissions } from '@/lib/api';
import { SubmissionFilters, PaginationState, SortOption } from '@/types/submission';

// Mock the API
jest.mock('@/lib/api', () => ({
  getSubmissions: jest.fn(),
}));

// Mock data
const mockSubmissionsData = {
  data: [
    {
      id: '1',
      ownerName: 'John Doe',
      phoneNumber: '123-456-7890',
      interestLevel: 5,
      signedUp: true,
      packageSeen: true,
      username: 'rogimon',
      territory: 'Kingston',
      timestamp: '2024-01-01T10:00:00Z',
    },
    {
      id: '2',
      ownerName: 'Jane Smith',
      phoneNumber: '234-567-8901',
      interestLevel: 3,
      signedUp: false,
      packageSeen: false,
      username: 'tatiana_1',
      territory: 'St. Andrew',
      timestamp: '2024-01-02T11:00:00Z',
    },
  ],
  totalCount: 50,
  pageCount: 5,
};

describe('useSubmissions', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
    (getSubmissions as jest.Mock).mockResolvedValue(mockSubmissionsData);
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  describe('Initial State', () => {
    it('should initialize with default values', async () => {
      const { result } = renderHook(() => useSubmissions(), { wrapper });

      // Initial loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.submissions).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.pageCount).toBe(0);
      expect(result.current.filters).toEqual({});
      expect(result.current.pagination).toEqual({ pageIndex: 0, pageSize: 25 });
      expect(result.current.sorting).toEqual([{ id: 'timestamp', desc: true }]);

      // Wait for data to load
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.submissions).toEqual(mockSubmissionsData.data);
      expect(result.current.totalCount).toBe(50);
      expect(result.current.pageCount).toBe(5);
    });

    it('should initialize with provided initial values', async () => {
      const initialFilters: SubmissionFilters = {
        search: 'test',
        interestLevel: [4, 5],
      };
      const initialPagination: PaginationState = {
        pageIndex: 2,
        pageSize: 50,
      };
      const initialSorting: SortOption[] = [
        { id: 'ownerName', desc: false },
      ];

      const { result } = renderHook(
        () => useSubmissions(initialFilters, initialPagination, initialSorting),
        { wrapper }
      );

      expect(result.current.filters).toEqual(initialFilters);
      expect(result.current.pagination).toEqual(initialPagination);
      expect(result.current.sorting).toEqual(initialSorting);

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          initialFilters,
          initialPagination,
          initialSorting
        );
      });
    });
  });

  describe('Filter Changes', () => {
    it('should update filters and reset pagination', async () => {
      const { result } = renderHook(() => useSubmissions(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change pagination first
      result.current.setPagination({ pageIndex: 3, pageSize: 25 });

      // Then change filters
      const newFilters: SubmissionFilters = {
        search: 'Kingston',
        interestLevel: [5],
      };

      result.current.setFilters(newFilters);

      await waitFor(() => {
        expect(result.current.filters).toEqual(newFilters);
        expect(result.current.pagination.pageIndex).toBe(0); // Reset to first page
        expect(result.current.pagination.pageSize).toBe(25); // Preserve page size
      });

      expect(getSubmissions).toHaveBeenLastCalledWith(
        newFilters,
        { pageIndex: 0, pageSize: 25 },
        expect.any(Array)
      );
    });

    it('should handle multiple filter updates', async () => {
      const { result } = renderHook(() => useSubmissions(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // First filter update
      result.current.setFilters({ search: 'test' });

      await waitFor(() => {
        expect(result.current.filters).toEqual({ search: 'test' });
      });

      // Second filter update
      result.current.setFilters({ search: 'test', signedUp: true });

      await waitFor(() => {
        expect(result.current.filters).toEqual({ search: 'test', signedUp: true });
      });

      // Third filter update - complete replacement
      result.current.setFilters({ interestLevel: [4, 5] });

      await waitFor(() => {
        expect(result.current.filters).toEqual({ interestLevel: [4, 5] });
      });
    });
  });

  describe('Pagination', () => {
    it('should update pagination without changing filters', async () => {
      const { result } = renderHook(() => useSubmissions(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newPagination: PaginationState = {
        pageIndex: 2,
        pageSize: 50,
      };

      result.current.setPagination(newPagination);

      await waitFor(() => {
        expect(result.current.pagination).toEqual(newPagination);
      });

      expect(getSubmissions).toHaveBeenLastCalledWith(
        {},
        newPagination,
        expect.any(Array)
      );
    });

    it('should preserve filters when changing pagination', async () => {
      const initialFilters: SubmissionFilters = {
        search: 'test',
        signedUp: true,
      };

      const { result } = renderHook(
        () => useSubmissions(initialFilters),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      result.current.setPagination({ pageIndex: 1, pageSize: 25 });

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenLastCalledWith(
          initialFilters,
          { pageIndex: 1, pageSize: 25 },
          expect.any(Array)
        );
      });
    });
  });

  describe('Sorting', () => {
    it('should update sorting', async () => {
      const { result } = renderHook(() => useSubmissions(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newSorting: SortOption[] = [
        { id: 'ownerName', desc: false },
        { id: 'timestamp', desc: true },
      ];

      result.current.setSorting(newSorting);

      await waitFor(() => {
        expect(result.current.sorting).toEqual(newSorting);
      });

      expect(getSubmissions).toHaveBeenLastCalledWith(
        {},
        expect.any(Object),
        newSorting
      );
    });
  });

  describe('Reset Filters', () => {
    it('should reset filters and pagination to initial values', async () => {
      const initialFilters: SubmissionFilters = {
        username: 'rogimon',
      };
      const initialPagination: PaginationState = {
        pageIndex: 0,
        pageSize: 10,
      };

      const { result } = renderHook(
        () => useSubmissions(initialFilters, initialPagination),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Apply some filters and change pagination
      result.current.setFilters({
        search: 'test',
        interestLevel: [4, 5],
        signedUp: true,
      });
      result.current.setPagination({ pageIndex: 3, pageSize: 50 });

      await waitFor(() => {
        expect(result.current.filters).toEqual({
          search: 'test',
          interestLevel: [4, 5],
          signedUp: true,
        });
        expect(result.current.pagination).toEqual({ pageIndex: 3, pageSize: 50 });
      });

      // Reset filters
      result.current.resetFilters();

      await waitFor(() => {
        expect(result.current.filters).toEqual({});
        expect(result.current.pagination).toEqual(initialPagination);
      });

      expect(getSubmissions).toHaveBeenLastCalledWith(
        {},
        initialPagination,
        expect.any(Array)
      );
    });
  });

  describe('Refetch', () => {
    it('should refetch data with current filters and pagination', async () => {
      const { result } = renderHook(() => useSubmissions(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Apply some filters
      result.current.setFilters({ search: 'test' });

      await waitFor(() => {
        expect(result.current.filters).toEqual({ search: 'test' });
      });

      // Clear mock to track refetch call
      (getSubmissions as jest.Mock).mockClear();

      // Refetch
      await result.current.refetch();

      expect(getSubmissions).toHaveBeenCalledWith(
        { search: 'test' },
        { pageIndex: 0, pageSize: 25 },
        [{ id: 'timestamp', desc: true }]
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors', async () => {
      const error = new Error('API Error');
      (getSubmissions as jest.Mock).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useSubmissions(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(error);
      expect(result.current.submissions).toEqual([]);
      expect(result.current.totalCount).toBe(0);
      expect(result.current.pageCount).toBe(0);
    });

    it('should recover from errors on refetch', async () => {
      const error = new Error('API Error');
      (getSubmissions as jest.Mock).mockRejectedValueOnce(error);

      const { result } = renderHook(() => useSubmissions(), { wrapper });

      await waitFor(() => {
        expect(result.current.error).toBe(error);
      });

      // Mock successful response for refetch
      (getSubmissions as jest.Mock).mockResolvedValueOnce(mockSubmissionsData);

      // Refetch
      await result.current.refetch();

      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.submissions).toEqual(mockSubmissionsData.data);
      });
    });
  });

  describe('Query Key Management', () => {
    it('should use correct query key for caching', async () => {
      const filters: SubmissionFilters = {
        search: 'test',
        interestLevel: [4, 5],
      };
      const pagination: PaginationState = {
        pageIndex: 1,
        pageSize: 25,
      };
      const sorting: SortOption[] = [
        { id: 'ownerName', desc: true },
      ];

      renderHook(
        () => useSubmissions(filters, pagination, sorting),
        { wrapper }
      );

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(filters, pagination, sorting);
      });

      // Render the same hook with same parameters
      const { result: result2 } = renderHook(
        () => useSubmissions(filters, pagination, sorting),
        { wrapper }
      );

      // Should use cached data, not call API again
      expect(getSubmissions).toHaveBeenCalledTimes(1);
      expect(result2.current.submissions).toEqual(mockSubmissionsData.data);
    });

    it('should refetch when query key changes', async () => {
      const { result, rerender } = renderHook(
        ({ filters }) => useSubmissions(filters),
        {
          wrapper,
          initialProps: { filters: { search: 'test1' } },
        }
      );

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          { search: 'test1' },
          expect.any(Object),
          expect.any(Object)
        );
      });

      // Change filters prop
      rerender({ filters: { search: 'test2' } });

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          { search: 'test2' },
          expect.any(Object),
          expect.any(Object)
        );
      });

      expect(getSubmissions).toHaveBeenCalledTimes(2);
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle rapid filter changes', async () => {
      const { result } = renderHook(() => useSubmissions(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Rapid filter changes
      result.current.setFilters({ search: 'a' });
      result.current.setFilters({ search: 'ab' });
      result.current.setFilters({ search: 'abc' });

      await waitFor(() => {
        expect(result.current.filters).toEqual({ search: 'abc' });
      });

      // Should only call API with the latest filters
      expect(getSubmissions).toHaveBeenLastCalledWith(
        { search: 'abc' },
        { pageIndex: 0, pageSize: 25 },
        expect.any(Array)
      );
    });

    it('should handle simultaneous filter, pagination, and sorting changes', async () => {
      const { result } = renderHook(() => useSubmissions(), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Change all three simultaneously
      result.current.setFilters({ signedUp: true });
      result.current.setPagination({ pageIndex: 2, pageSize: 50 });
      result.current.setSorting([{ id: 'interestLevel', desc: true }]);

      await waitFor(() => {
        expect(result.current.filters).toEqual({ signedUp: true });
        expect(result.current.pagination).toEqual({ pageIndex: 0, pageSize: 50 }); // Reset to page 0 due to filter change
        expect(result.current.sorting).toEqual([{ id: 'interestLevel', desc: true }]);
      });
    });
  });
});