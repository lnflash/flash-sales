import React from 'react';
import { render, screen } from '@testing-library/react';
import { useRouter } from 'next/router';
import LeadsPage from './leads';
import { useSubmissions } from '@/hooks/useSubmissions';
import { getUserFromStorage } from '@/lib/auth';

// Mock the dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn()
}));

jest.mock('@/hooks/useSubmissions', () => ({
  useSubmissions: jest.fn()
}));

jest.mock('@/lib/auth', () => ({
  getUserFromStorage: jest.fn()
}));

jest.mock('@/types/roles', () => ({
  hasPermission: jest.fn(() => false) // Default to false, override in specific tests
}));

// Mock the components
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

describe('LeadsPage', () => {
  const mockRouter = {
    push: jest.fn(),
    query: {},
    pathname: '/dashboard/leads'
  };

  const mockSubmissions = [
    {
      id: '1',
      ownerName: 'Recent Business',
      phoneNumber: '555-0001',
      packageSeen: false,
      decisionMakers: '',
      interestLevel: 3,
      signedUp: false,
      leadStatus: 'contacted',
      specificNeeds: '',
      username: 'testuser',
      territory: 'Kingston',
      timestamp: new Date().toISOString() // Recent
    },
    {
      id: '2',
      ownerName: 'Old Business',
      phoneNumber: '555-0002',
      packageSeen: true,
      decisionMakers: 'Manager',
      interestLevel: 4,
      signedUp: false,
      leadStatus: 'prospect',
      specificNeeds: 'Needs POS',
      username: 'testuser',
      territory: 'Portland',
      timestamp: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString() // 35 days old
    },
    {
      id: '3',
      ownerName: 'Signed Up Business',
      phoneNumber: '555-0003',
      packageSeen: true,
      decisionMakers: 'Owner',
      interestLevel: 5,
      signedUp: true,
      leadStatus: 'signed_up',
      specificNeeds: '',
      username: 'testuser',
      territory: 'Kingston',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() // 5 days old
    }
  ];

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (getUserFromStorage as jest.Mock).mockReturnValue({
      username: 'testuser',
      role: 'sales_rep'
    });
    (useSubmissions as jest.Mock).mockReturnValue({
      submissions: mockSubmissions,
      isLoading: false
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the lead management page', () => {
    render(<LeadsPage />);
    
    expect(screen.getByText('Lead Management')).toBeInTheDocument();
  });

  it('should display lead statistics correctly', () => {
    render(<LeadsPage />);
    
    // Check stats cards
    expect(screen.getByText('Total Leads')).toBeInTheDocument();
    expect(screen.getAllByText('3')[0]).toBeInTheDocument(); // Total leads
    
    expect(screen.getByText('Active Leads')).toBeInTheDocument();
    expect(screen.getAllByText('1')[0]).toBeInTheDocument(); // Active leads (not signed up and within 30 days)
    
    expect(screen.getByText('New Leads')).toBeInTheDocument();
    expect(screen.getAllByText('2')[0]).toBeInTheDocument(); // New leads (within 7 days)
    
    expect(screen.getByText('Stale Leads')).toBeInTheDocument();
    expect(screen.getAllByText('1')[1]).toBeInTheDocument(); // Stale leads (older than 30 days)
  });

  it('should render key components', () => {
    render(<LeadsPage />);
    
    expect(screen.getByTestId('territory-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('lead-workflow-pipeline')).toBeInTheDocument();
  });

  it('should display stale leads section when there are stale leads', () => {
    render(<LeadsPage />);
    
    expect(screen.getByText(/Stale Leads \(1\)/)).toBeInTheDocument();
    expect(screen.getByText('Leads that haven\'t been updated in over 30 days')).toBeInTheDocument();
    // Use getAllByText since the business name might appear multiple times
    expect(screen.getAllByText('Old Business')[0]).toBeInTheDocument();
  });

  it('should calculate conversion rate correctly', () => {
    render(<LeadsPage />);
    
    expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
    // 1 signed up out of 3 total = 33.3%
    expect(screen.getByText('33.3%')).toBeInTheDocument();
  });

  it('should fetch all submissions without pagination limit', () => {
    render(<LeadsPage />);
    
    // The hook should be called with the correct filters (check last call)
    expect(useSubmissions).toHaveBeenCalled();
    const lastCall = (useSubmissions as jest.Mock).mock.calls[(useSubmissions as jest.Mock).mock.calls.length - 1];
    const [filters, pagination] = lastCall;
    expect(filters).toEqual({ username: 'testuser' });
    expect(pagination).toEqual({ pageIndex: 0, pageSize: 2000 });
  });

  it('should show active opportunities', () => {
    render(<LeadsPage />);
    
    expect(screen.getByText('Active Opportunities')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    (useSubmissions as jest.Mock).mockReturnValue({
      submissions: [],
      isLoading: true
    });

    render(<LeadsPage />);
    
    // Should still render the page structure
    expect(screen.getByText('Lead Management')).toBeInTheDocument();
  });

  it('should apply correct filters for non-admin users', () => {
    // Clear previous mock calls
    (useSubmissions as jest.Mock).mockClear();
    
    (getUserFromStorage as jest.Mock).mockReturnValue({
      username: 'salesrep1',
      role: 'sales_rep'
    });

    render(<LeadsPage />);

    expect(useSubmissions).toHaveBeenCalled();
    const lastCall = (useSubmissions as jest.Mock).mock.calls[(useSubmissions as jest.Mock).mock.calls.length - 1];
    const [filters, pagination] = lastCall;
    expect(filters).toEqual({ username: 'salesrep1' });
    expect(pagination).toEqual({ pageIndex: 0, pageSize: 2000 });
  });

  it('should not apply username filter for admin users', () => {
    // Clear previous mock calls
    (useSubmissions as jest.Mock).mockClear();
    
    (getUserFromStorage as jest.Mock).mockReturnValue({
      username: 'admin',
      role: 'admin'
    });

    const { hasPermission } = require('@/types/roles');
    hasPermission.mockReturnValue(true);

    render(<LeadsPage />);

    expect(useSubmissions).toHaveBeenCalled();
    const lastCall = (useSubmissions as jest.Mock).mock.calls[(useSubmissions as jest.Mock).mock.calls.length - 1];
    const [filters, pagination] = lastCall;
    expect(filters).toEqual({}); // No filters for admin
    expect(pagination).toEqual({ pageIndex: 0, pageSize: 2000 });
  });
});