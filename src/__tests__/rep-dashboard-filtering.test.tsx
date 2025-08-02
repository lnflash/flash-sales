import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RepDashboard from '@/pages/dashboard/rep-dashboard';
import { getUserFromStorage } from '@/lib/auth';
import { useUserSubmissions } from '@/hooks/useUserSubmissions';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/hooks/useUserSubmissions');
jest.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/dashboard/rep-dashboard',
  }),
}));

// Mock DashboardLayout to avoid rendering issues
jest.mock('@/components/layout/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children, title }: { children: React.ReactNode, title?: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  )
}));

// Mock child components that might cause issues
jest.mock('@/components/rep-dashboard/RepFilter', () => ({
  __esModule: true,
  default: () => <div>RepFilter</div>
}));

jest.mock('@/components/rep-dashboard/LeadStatusCard', () => ({
  __esModule: true,
  default: () => <div>LeadStatusCard</div>
}));

jest.mock('@/components/rep-dashboard/FollowUpPriorities', () => ({
  __esModule: true,
  default: () => <div>FollowUpPriorities</div>
}));

jest.mock('@/components/rep-dashboard/PerformanceSnapshot', () => ({
  __esModule: true,
  default: ({ totalCount }: { totalCount: number }) => <div>{totalCount}</div>
}));

const mockGetUserFromStorage = getUserFromStorage as jest.MockedFunction<typeof getUserFromStorage>;
const mockUseUserSubmissions = useUserSubmissions as jest.MockedFunction<typeof useUserSubmissions>;

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
      data: {
        submissions: [
          { id: 1, ownerName: 'Test Owner 1', username: 'charms' },
          { id: 2, ownerName: 'Test Owner 2', username: 'charms' },
        ],
        count: 2,
      },
      isLoading: false,
      error: null,
    };

    mockUseUserSubmissions.mockReturnValue(mockSubmissionsData);

    render(
      <QueryClientProvider client={queryClient}>
        <RepDashboard />
      </QueryClientProvider>
    );

    // Wait for the component to load
    await waitFor(() => {
      expect(screen.getByText("charms's Dashboard")).toBeInTheDocument();
    });

    // Check that useUserSubmissions was called with username filter
    expect(mockUseUserSubmissions).toHaveBeenCalledWith('charms');

    // Check that the correct number of submissions is displayed
    // There may be multiple "2"s on the page (submission count, total leads, etc.)
    const countElements = screen.getAllByText('2');
    expect(countElements.length).toBeGreaterThan(0);
  });

  test('handles case sensitivity in username', async () => {
    // Mock user with uppercase username
    mockGetUserFromStorage.mockReturnValue({
      username: 'CHARMS',
      userId: 'test-user-id',
      role: 'Flash Sales Rep',
      loggedInAt: Date.now(),
    });

    mockUseUserSubmissions.mockReturnValue({
      data: {
        submissions: [],
        count: 0,
      },
      isLoading: false,
      error: null,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RepDashboard />
      </QueryClientProvider>
    );

    // Check that useUserSubmissions was called with the uppercase username
    expect(mockUseUserSubmissions).toHaveBeenCalledWith('CHARMS');
  });
});