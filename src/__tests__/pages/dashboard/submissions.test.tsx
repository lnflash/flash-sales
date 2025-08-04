import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import '@testing-library/jest-dom';
import SubmissionsPage from '@/pages/dashboard/submissions';
import { getSubmissions } from '@/lib/api';
import { getUserFromStorage } from '@/lib/auth';
import { hasPermission } from '@/types/roles';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getSubmissions: jest.fn(),
  deleteSubmission: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  getUserFromStorage: jest.fn(),
}));

jest.mock('@/types/roles', () => ({
  hasPermission: jest.fn(),
}));

// Mock DashboardLayout
jest.mock('@/components/layout/DashboardLayout', () => ({
  __esModule: true,
  default: ({ children, title }: { children: React.ReactNode; title: string }) => (
    <div>
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

// Mock SubmissionTable
jest.mock('@/components/submissions/SubmissionTable', () => ({
  __esModule: true,
  default: ({ 
    submissions = [], 
    onView, 
    onEdit, 
    onDelete, 
    deletingId 
  }: any) => (
    <div data-testid="submission-table">
      {submissions.map((submission: any) => (
        <div key={submission.id} data-testid={`submission-${submission.id}`}>
          <span>{submission.ownerName}</span>
          <span>{submission.interestLevel}</span>
          <span>{submission.signedUp ? 'Signed Up' : 'Prospect'}</span>
          <span>{submission.packageSeen ? 'Package Seen' : 'Not Seen'}</span>
          <span>{submission.username}</span>
          <button onClick={() => onView(submission.id)}>View</button>
          <button onClick={() => onEdit(submission.id)}>Edit</button>
          <button onClick={() => onDelete(submission.id)}>Delete</button>
        </div>
      ))}
    </div>
  ),
}));

// Mock data
const mockSubmissions = [
  {
    id: '1',
    ownerName: 'John Doe',
    phoneNumber: '123-456-7890',
    email: 'john@example.com',
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
    email: 'jane@example.com',
    interestLevel: 3,
    signedUp: false,
    packageSeen: false,
    username: 'tatiana_1',
    territory: 'St. Andrew',
    timestamp: '2024-01-02T11:00:00Z',
  },
  {
    id: '3',
    ownerName: 'Bob Johnson',
    phoneNumber: '345-678-9012',
    email: 'bob@example.com',
    interestLevel: 4,
    signedUp: true,
    packageSeen: false,
    username: 'charms',
    territory: 'Portland',
    timestamp: '2024-01-03T12:00:00Z',
  },
  {
    id: '4',
    ownerName: 'Alice Williams',
    phoneNumber: '456-789-0123',
    email: 'alice@example.com',
    interestLevel: 2,
    signedUp: false,
    packageSeen: true,
    username: 'rogimon',
    territory: 'Kingston',
    timestamp: '2024-01-04T13:00:00Z',
  },
  {
    id: '5',
    ownerName: 'Charlie Brown',
    phoneNumber: '567-890-1234',
    email: 'charlie@example.com',
    interestLevel: 1,
    signedUp: false,
    packageSeen: false,
    username: 'Unassigned',
    territory: 'Manchester',
    timestamp: '2024-01-05T14:00:00Z',
  },
];

describe('SubmissionsPage', () => {
  let queryClient: QueryClient;
  const mockRouterPush = jest.fn();
  const mockRouterQuery = {};

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockRouterPush,
      query: mockRouterQuery,
    });

    (getUserFromStorage as jest.Mock).mockReturnValue({
      username: 'admin',
      role: 'admin',
    });

    (hasPermission as jest.Mock).mockReturnValue(true);

    (getSubmissions as jest.Mock).mockResolvedValue({
      data: mockSubmissions,
      totalCount: mockSubmissions.length,
      pageCount: 1,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  describe('Filter Tests', () => {
    it('should render all filters correctly', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      // Wait for initial data load
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Click on filters button to show filter panel
      const filtersButton = screen.getByText('Filters');
      fireEvent.click(filtersButton);

      // Check all filter sections are present
      expect(screen.getByText('Interest Level')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Package Seen')).toBeInTheDocument();
      expect(screen.getByText('Sales Rep')).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();
    });

    it('should filter by search term', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by name, phone, email, territory, rep...');
      await userEvent.type(searchInput, 'john');
      
      // Submit search form
      const form = searchInput.closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'john' }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should filter by interest level', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      // Click interest level 5
      const level5Button = screen.getByText('Level 5');
      fireEvent.click(level5Button);

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          expect.objectContaining({ interestLevel: [5] }),
          expect.any(Object),
          expect.any(Object)
        );
      });

      // Add interest level 4
      const level4Button = screen.getByText('Level 4');
      fireEvent.click(level4Button);

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          expect.objectContaining({ interestLevel: [5, 4] }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should filter by signed up status', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      // Click "Signed Up" button
      const signedUpButton = screen.getByText('Signed Up');
      fireEvent.click(signedUpButton);

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          expect.objectContaining({ signedUp: true }),
          expect.any(Object),
          expect.any(Object)
        );
      });

      // Click "Prospect" button
      const prospectButton = screen.getByText('Prospect');
      fireEvent.click(prospectButton);

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          expect.objectContaining({ signedUp: false }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should filter by package seen status', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      // Find the Package Seen section buttons
      const packageSeenSection = screen.getByText('Package Seen').closest('div');
      const yesButton = within(packageSeenSection!).getByText('Yes');
      const noButton = within(packageSeenSection!).getByText('No');

      // Click "Yes" button
      fireEvent.click(yesButton);

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          expect.objectContaining({ packageSeen: true }),
          expect.any(Object),
          expect.any(Object)
        );
      });

      // Click "No" button
      fireEvent.click(noButton);

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          expect.objectContaining({ packageSeen: false }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should filter by sales rep', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      // Select a sales rep
      const salesRepSelect = screen.getByLabelText('Sales Rep');
      fireEvent.change(salesRepSelect, { target: { value: 'rogimon' } });

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          expect.objectContaining({ username: 'rogimon' }),
          expect.any(Object),
          expect.any(Object)
        );
      });

      // Select "Unassigned"
      fireEvent.change(salesRepSelect, { target: { value: 'Unassigned' } });

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          expect.objectContaining({ username: 'Unassigned' }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should filter by date range', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      // Set date range
      const fromDateInput = screen.getByLabelText('From');
      const toDateInput = screen.getByLabelText('To');

      fireEvent.change(fromDateInput, { target: { value: '2024-01-01' } });
      fireEvent.change(toDateInput, { target: { value: '2024-01-31' } });

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          expect.objectContaining({
            dateRange: {
              start: '2024-01-01',
              end: '2024-01-31',
            },
          }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should clear all filters', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Apply some filters
      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Level 5'));
      fireEvent.click(screen.getByText('Signed Up'));

      await waitFor(() => {
        expect(screen.getByText('Filters Active')).toBeInTheDocument();
      });

      // Click clear button
      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          {}, // Empty filters
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should maintain filters for sales rep without view all permission', async () => {
      // Mock user as sales rep
      (getUserFromStorage as jest.Mock).mockReturnValue({
        username: 'rogimon',
        role: 'sales_rep',
      });
      (hasPermission as jest.Mock).mockReturnValue(false);

      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          expect.objectContaining({ username: 'rogimon' }),
          expect.any(Object),
          expect.any(Object)
        );
      });

      // Try to clear filters
      fireEvent.click(screen.getByText('Filters'));
      
      // Clear button should maintain username filter
      if (screen.queryByText('Clear')) {
        fireEvent.click(screen.getByText('Clear'));
        
        await waitFor(() => {
          expect(getSubmissions).toHaveBeenCalledWith(
            expect.objectContaining({ username: 'rogimon' }),
            expect.any(Object),
            expect.any(Object)
          );
        });
      }
    });

    it('should combine multiple filters correctly', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Apply multiple filters
      const searchInput = screen.getByPlaceholderText('Search by name, phone, email, territory, rep...');
      await userEvent.type(searchInput, 'Kingston');
      fireEvent.submit(searchInput.closest('form')!);

      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Level 5'));
      fireEvent.click(screen.getByText('Level 4'));
      fireEvent.click(screen.getByText('Signed Up'));

      const salesRepSelect = screen.getByLabelText('Sales Rep');
      fireEvent.change(salesRepSelect, { target: { value: 'rogimon' } });

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Kingston',
            interestLevel: [5, 4],
            signedUp: true,
            username: 'rogimon',
          }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should clear search input when X is clicked', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Search by name, phone, email, territory, rep...');
      await userEvent.type(searchInput, 'test search');
      fireEvent.submit(searchInput.closest('form')!);

      // Wait for search to be applied
      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'test search' }),
          expect.any(Object),
          expect.any(Object)
        );
      });

      // Click the X button
      const clearSearchButton = screen.getByRole('button', { name: '' });
      fireEvent.click(clearSearchButton);

      // Search should be cleared
      expect(searchInput).toHaveValue('');
      
      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          expect.not.objectContaining({ search: 'test search' }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should toggle filter visibility correctly', async () => {
      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Filters should be hidden initially
      expect(screen.queryByText('Interest Level')).not.toBeInTheDocument();

      // Show filters
      fireEvent.click(screen.getByText('Filters'));
      expect(screen.getByText('Interest Level')).toBeInTheDocument();

      // Hide filters
      fireEvent.click(screen.getByText('Filters'));
      expect(screen.queryByText('Interest Level')).not.toBeInTheDocument();
    });

    it('should handle URL search parameter on mount', async () => {
      // Mock router with search query
      (useRouter as jest.Mock).mockReturnValue({
        push: mockRouterPush,
        query: { search: 'initial search' },
      });

      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          expect.objectContaining({ search: 'initial search' }),
          expect.any(Object),
          expect.any(Object)
        );
      });
    });

    it('should reset pagination when filters change', async () => {
      (getSubmissions as jest.Mock).mockResolvedValue({
        data: mockSubmissions.slice(0, 2),
        totalCount: mockSubmissions.length,
        pageCount: 3,
      });

      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Apply a filter
      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Level 5'));

      await waitFor(() => {
        expect(getSubmissions).toHaveBeenCalledWith(
          expect.objectContaining({ interestLevel: [5] }),
          expect.objectContaining({ pageIndex: 0 }), // Reset to first page
          expect.any(Object)
        );
      });
    });
  });

  describe('Integration Tests', () => {
    it('should filter and display correct results', async () => {
      // Mock filtered results
      const filteredSubmissions = mockSubmissions.filter(s => s.interestLevel === 5);
      (getSubmissions as jest.Mock).mockResolvedValueOnce({
        data: filteredSubmissions,
        totalCount: filteredSubmissions.length,
        pageCount: 1,
      });

      renderWithQueryClient(<SubmissionsPage />);

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Apply interest level filter
      fireEvent.click(screen.getByText('Filters'));
      fireEvent.click(screen.getByText('Level 5'));

      await waitFor(() => {
        // Only high interest submission should be visible
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
        expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
      });
    });

    it('should handle empty filter results', async () => {
      // Mock empty results
      (getSubmissions as jest.Mock).mockResolvedValueOnce({
        data: [],
        totalCount: 0,
        pageCount: 0,
      });

      renderWithQueryClient(<SubmissionsPage />);

      // Apply a filter that returns no results
      fireEvent.click(screen.getByText('Filters'));
      const salesRepSelect = screen.getByLabelText('Sales Rep');
      fireEvent.change(salesRepSelect, { target: { value: 'nonexistent' } });

      await waitFor(() => {
        expect(screen.getByTestId('submission-table')).toBeInTheDocument();
        // Table should be empty
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      });
    });
  });
});