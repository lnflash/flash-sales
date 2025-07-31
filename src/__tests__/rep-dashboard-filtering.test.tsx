import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RepDashboard from '@/pages/dashboard/rep-dashboard';
import { getUserFromStorage } from '@/lib/auth';
import { useSubmissions } from '@/hooks/useSubmissions';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/hooks/useSubmissions');
jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/dashboard/rep-dashboard',
  }),
}));

const mockGetUserFromStorage = getUserFromStorage as jest.MockedFunction<typeof getUserFromStorage>;
const mockUseSubmissions = useSubmissions as jest.MockedFunction<typeof useSubmissions>;

describe('RepDashboard Filtering', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('filters submissions by logged-in username', async () => {
    // Mock user with username 'charms'
    mockGetUserFromStorage.mockReturnValue({
      username: 'charms',
      userId: 'test-user-id',
      role: 'Flash Sales Rep',
      loggedInAt: Date.now(),
    });

    // Mock submissions hook
    const mockSubmissionsData = {
      submissions: [
        { id: 1, ownerName: 'Test Owner 1', username: 'charms' },
        { id: 2, ownerName: 'Test Owner 2', username: 'charms' },
      ],
      totalCount: 2,
      pageCount: 1,
      isLoading: false,
      error: null,
      filters: { username: 'charms' },
      pagination: { pageIndex: 0, pageSize: 1000 },
      sorting: [],
      setFilters: jest.fn(),
      setPagination: jest.fn(),
      setSorting: jest.fn(),
      resetFilters: jest.fn(),
      refetch: jest.fn(),
    };

    mockUseSubmissions.mockReturnValue(mockSubmissionsData);

    render(
      <QueryClientProvider client={queryClient}>
        <RepDashboard />
      </QueryClientProvider>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("charms's Dashboard")).toBeInTheDocument();
    });

    // Check that useSubmissions was called with username filter
    expect(mockUseSubmissions).toHaveBeenCalledWith(
      { username: 'charms' },
      { pageIndex: 0, pageSize: 1000 }
    );

    // Check that the correct number of submissions is displayed
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  test('handles case sensitivity in username', async () => {
    // Mock user with uppercase username
    mockGetUserFromStorage.mockReturnValue({
      username: 'CHARMS',
      userId: 'test-user-id',
      role: 'Flash Sales Rep',
      loggedInAt: Date.now(),
    });

    mockUseSubmissions.mockReturnValue({
      submissions: [],
      totalCount: 0,
      pageCount: 0,
      isLoading: false,
      error: null,
      filters: { username: 'CHARMS' },
      pagination: { pageIndex: 0, pageSize: 1000 },
      sorting: [],
      setFilters: jest.fn(),
      setPagination: jest.fn(),
      setSorting: jest.fn(),
      resetFilters: jest.fn(),
      refetch: jest.fn(),
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RepDashboard />
      </QueryClientProvider>
    );

    // Check that useSubmissions was called with the uppercase username
    expect(mockUseSubmissions).toHaveBeenCalledWith(
      { username: 'CHARMS' },
      { pageIndex: 0, pageSize: 1000 }
    );
  });
});