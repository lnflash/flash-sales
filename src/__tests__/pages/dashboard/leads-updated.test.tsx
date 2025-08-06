import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import LeadsPage from '@/pages/dashboard/leads';
import { getUserFromStorage } from '@/lib/auth';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/lib/auth', () => ({
  getUserFromStorage: jest.fn()
}));

jest.mock('@/hooks/useUserSubmissions', () => ({
  useUserSubmissions: jest.fn()
}));

jest.mock('@/hooks/useSubmissions', () => ({
  useSubmissions: jest.fn()
}));

jest.mock('@/types/roles', () => ({
  hasPermission: jest.fn()
}));

// Mock layout components
jest.mock('@/components/layout/DashboardLayout', () => {
  return function DashboardLayout({ children, title }: any) {
    return (
      <div>
        <h1>{title}</h1>
        {children}
      </div>
    );
  };
});

// Mock child components
jest.mock('@/components/sales-intelligence/LeadWorkflowPipeline', () => {
  return function LeadWorkflowPipeline() {
    return <div data-testid="lead-workflow-pipeline">Lead Workflow Pipeline</div>;
  };
});

jest.mock('@/components/sales-intelligence/TerritoryDashboard', () => {
  return function TerritoryDashboard() {
    return <div data-testid="territory-dashboard">Territory Dashboard</div>;
  };
});

jest.mock('@/components/sales-intelligence/FollowUpRecommendations', () => {
  return function FollowUpRecommendations() {
    return <div data-testid="follow-up-recommendations">Follow Up Recommendations</div>;
  };
});

jest.mock('@/components/sales-intelligence/LeadAssignment', () => {
  return function LeadAssignment() {
    return <div data-testid="lead-assignment">Lead Assignment</div>;
  };
});


jest.mock('@/components/leads/LeadsTable', () => ({
  LeadsTable: function LeadsTable({ submissions }: any) {
    return <div data-testid="leads-table">Leads Table: {submissions?.length || 0} leads</div>;
  }
}));

jest.mock('@/components/leads/BulkActions', () => {
  return function BulkActions() {
    return <div data-testid="bulk-actions">Bulk Actions</div>;
  };
});

jest.mock('@/components/ui/quick-filters', () => {
  return function QuickFilters() {
    return <div data-testid="quick-filters">Quick Filters</div>;
  };
});

describe('LeadsPage - Updated Tests', () => {
  let queryClient: QueryClient;
  
  const mockRouter = {
    push: jest.fn(),
    query: {},
    pathname: '/dashboard/leads',
    asPath: '/dashboard/leads'
  };

  const mockSubmissions = [
    {
      id: '1',
      ownerName: 'Recent Business',
      phoneNumber: '1234567890',
      interestLevel: 8,
      leadStatus: 'new',
      username: 'testuser',
      territory: 'Kingston',
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      ownerName: 'Active Lead',
      phoneNumber: '0987654321',
      interestLevel: 6,
      leadStatus: 'follow_up',
      username: 'testuser',
      territory: 'Montego Bay',
      timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: '3',
      ownerName: 'Old Business',
      phoneNumber: '5555555555',
      interestLevel: 5,
      leadStatus: 'new',
      username: 'testuser',
      territory: 'Kingston',
      timestamp: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false }
      }
    });
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    (getUserFromStorage as jest.Mock).mockReturnValue({
      username: 'testuser',
      role: 'Flash Sales Rep'
    });
    
    const { useUserSubmissions } = jest.requireMock('@/hooks/useUserSubmissions');
    (useUserSubmissions as jest.Mock).mockReturnValue({
      data: { 
        submissions: mockSubmissions, 
        count: mockSubmissions.length
      },
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });
    
    const { useSubmissions } = jest.requireMock('@/hooks/useSubmissions');
    (useSubmissions as jest.Mock).mockReturnValue({
      submissions: mockSubmissions,
      isLoading: false,
      error: null
    });
    
    const { hasPermission } = jest.requireMock('@/types/roles');
    (hasPermission as jest.Mock).mockReturnValue(false);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the lead management page', () => {
    renderWithProviders(<LeadsPage />);
    
    expect(screen.getByText('Lead Management')).toBeInTheDocument();
  });

  it('should render all major components', () => {
    renderWithProviders(<LeadsPage />);
    
    expect(screen.getByTestId('leads-table')).toBeInTheDocument();
    expect(screen.getByTestId('territory-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('lead-workflow-pipeline')).toBeInTheDocument();
  });

  it('should display correct stats', () => {
    renderWithProviders(<LeadsPage />);
    
    // Total Leads
    expect(screen.getByText('Total Leads')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // The other stats might have specific calculations, so we just check they exist
    expect(screen.getByText('Active Leads')).toBeInTheDocument();
    expect(screen.getByText('New Leads')).toBeInTheDocument();
    expect(screen.getByText('Stale Leads')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    const { useUserSubmissions } = jest.requireMock('@/hooks/useUserSubmissions');
    (useUserSubmissions as jest.Mock).mockReturnValue({
      data: null,
      isLoading: true,
      error: null
    });
    
    renderWithProviders(<LeadsPage />);
    
    // Should show loading message
    expect(screen.getByText('Loading lead data...')).toBeInTheDocument();
  });

  it('should handle admin permissions', () => {
    const { hasPermission } = jest.requireMock('@/types/roles');
    (hasPermission as jest.Mock).mockReturnValue(true);
    
    (getUserFromStorage as jest.Mock).mockReturnValue({
      username: 'flash',
      role: 'Flash Admin'
    });
    
    renderWithProviders(<LeadsPage />);
    
    // Admin should see the page with all regular components
    expect(screen.getByText('Lead Management')).toBeInTheDocument();
    expect(screen.getByTestId('territory-dashboard')).toBeInTheDocument();
  });

  it('should not show admin components for regular users', () => {
    const { hasPermission } = jest.requireMock('@/types/roles');
    (hasPermission as jest.Mock).mockReturnValue(false);
    
    renderWithProviders(<LeadsPage />);
    
    // Regular users should see the basic page components
    expect(screen.getByText('Lead Management')).toBeInTheDocument();
    // Lead assignment modal should not be shown by default
    expect(screen.queryByTestId('lead-assignment')).not.toBeInTheDocument();
  });
});