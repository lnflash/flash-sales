import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TerritoryAssignmentManager from '@/components/territories/TerritoryAssignmentManager';
import { supabase } from '@/lib/supabase/client';

// Mock Supabase
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}));

// Mock territory types
jest.mock('@/types/territory', () => ({
  ...jest.requireActual('@/types/territory'),
  PROOF_OF_CONCEPT_COUNTRIES: [
    {
      code: 'JM',
      name: 'Jamaica',
      flagEmoji: '🇯🇲',
      languages: ['en'],
      currencyCode: 'JMD'
    },
    {
      code: 'KY',
      name: 'Cayman Islands',
      flagEmoji: '🇰🇾',
      languages: ['en'],
      currencyCode: 'KYD'
    },
    {
      code: 'CW',
      name: 'Curaçao',
      flagEmoji: '🇨🇼',
      languages: ['nl', 'pap'],
      currencyCode: 'ANG'
    }
  ]
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('TerritoryAssignmentManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock auth user
    (supabase.auth.getUser as jest.Mock).mockResolvedValue({
      data: { user: { id: 'admin-user-id' } }
    });
    
    // Mock default queries
    const fromMock = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
    };
    
    (supabase.from as jest.Mock).mockReturnValue(fromMock);
  });

  it('renders the Territory Assignment Manager', () => {
    render(<TerritoryAssignmentManager />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Territory Assignment Manager')).toBeInTheDocument();
    expect(screen.getByText('Assign sales representatives to territories across different countries')).toBeInTheDocument();
  });

  it('displays country selector with proof of concept countries', () => {
    render(<TerritoryAssignmentManager />, { wrapper: createWrapper() });
    
    expect(screen.getByText('Select Country')).toBeInTheDocument();
    
    // Find country selector by its specific class or content
    const selectors = screen.getAllByRole('combobox');
    const countrySelector = selectors[0]; // First selector is country selector
    expect(countrySelector).toBeInTheDocument();
    
    // Verify countries are in the selector
    expect(screen.getByText('🇯🇲 Jamaica')).toBeInTheDocument();
    expect(screen.getByText('🇰🇾 Cayman Islands')).toBeInTheDocument();
    expect(screen.getByText('🇨🇼 Curaçao')).toBeInTheDocument();
  });

  it('loads sales reps from the database', async () => {
    const mockReps = [
      { id: 'rep1', username: 'john.doe', email: 'john@flash.com', full_name: 'John Doe' },
      { id: 'rep2', username: 'jane.smith', email: 'jane@flash.com', full_name: 'Jane Smith' }
    ];
    
    const fromMock = {
      select: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockReps, error: null })
    };
    
    (supabase.from as jest.Mock).mockReturnValue(fromMock);
    
    render(<TerritoryAssignmentManager />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      const repSelector = screen.getByText('Select a sales rep...');
      expect(repSelector).toBeInTheDocument();
    });
    
    // Open the rep selector
    const repSelector = screen.getByText('Select a sales rep...').closest('select');
    fireEvent.click(repSelector!);
    
    await waitFor(() => {
      expect(screen.getByText('john.doe (john@flash.com)')).toBeInTheDocument();
      expect(screen.getByText('jane.smith (jane@flash.com)')).toBeInTheDocument();
    });
  });

  it('loads territories when country is selected', async () => {
    const mockTerritories = [
      { id: 'kingston-id', name: 'Kingston', country_id: 'JM', level: 1, is_active: true },
      { id: 'st-andrew-id', name: 'St. Andrew', country_id: 'JM', level: 1, is_active: true }
    ];
    
    const fromMock = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockTerritories, error: null })
    };
    
    (supabase.from as jest.Mock).mockReturnValue(fromMock);
    
    render(<TerritoryAssignmentManager />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Kingston')).toBeInTheDocument();
      expect(screen.getByText('St. Andrew')).toBeInTheDocument();
    });
  });

  it('allows selecting multiple territories', async () => {
    const mockTerritories = [
      { id: 'kingston-id', name: 'Kingston', country_id: 'JM', level: 1, is_active: true },
      { id: 'st-andrew-id', name: 'St. Andrew', country_id: 'JM', level: 1, is_active: true }
    ];
    
    const fromMock = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({ data: mockTerritories, error: null })
    };
    
    (supabase.from as jest.Mock).mockReturnValue(fromMock);
    
    render(<TerritoryAssignmentManager />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Kingston')).toBeInTheDocument();
    });
    
    // Select territories
    const kingstonCheckbox = screen.getByText('Kingston').closest('label')?.querySelector('input[type="checkbox"]');
    const stAndrewCheckbox = screen.getByText('St. Andrew').closest('label')?.querySelector('input[type="checkbox"]');
    
    fireEvent.click(kingstonCheckbox!);
    fireEvent.click(stAndrewCheckbox!);
    
    expect(screen.getByText('2 territories selected')).toBeInTheDocument();
  });

  it('assigns territories to a sales rep', async () => {
    const mockReps = [
      { id: 'rep1', username: 'john.doe', email: 'john@flash.com', full_name: 'John Doe' }
    ];
    
    const mockTerritories = [
      { id: 'kingston-id', name: 'Kingston', country_id: 'JM', level: 1, is_active: true }
    ];
    
    let insertCalled = false;
    
    // Setup different mocks for different queries
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'users') {
        return {
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mockReps, error: null })
        };
      }
      if (table === 'territories') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mockTerritories, error: null })
        };
      }
      if (table === 'territory_assignments') {
        return {
          select: jest.fn().mockImplementation(() => {
            if (insertCalled) {
              insertCalled = false;
              return Promise.resolve({ data: [{ id: 'assignment1' }], error: null });
            }
            return Promise.resolve({ data: [], error: null });
          }),
          eq: jest.fn().mockReturnThis(),
          in: jest.fn().mockReturnThis(),
          update: jest.fn().mockReturnThis(),
          insert: jest.fn().mockImplementation(() => {
            insertCalled = true;
            return { select: jest.fn().mockResolvedValue({ data: [{ id: 'assignment1' }], error: null }) };
          })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      };
    });
    
    render(<TerritoryAssignmentManager />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Kingston')).toBeInTheDocument();
    });
    
    // Select rep
    const repSelector = screen.getByText('Select a sales rep...').closest('select');
    fireEvent.change(repSelector!, { target: { value: 'rep1' } });
    
    // Select territory
    const kingstonCheckbox = screen.getByText('Kingston').closest('label')?.querySelector('input[type="checkbox"]');
    fireEvent.click(kingstonCheckbox!);
    
    // Click assign button
    const assignButton = screen.getByText('Assign Territories');
    fireEvent.click(assignButton);
    
    // Wait for success message
    await waitFor(() => {
      expect(screen.getByText('Territories assigned successfully!')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('shows error when trying to assign without selecting rep or territories', async () => {
    render(<TerritoryAssignmentManager />, { wrapper: createWrapper() });
    
    const assignButton = screen.getByText('Assign Territories');
    fireEvent.click(assignButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please select a sales rep and at least one territory')).toBeInTheDocument();
    });
  });

  it('displays current assignments', async () => {
    const mockAssignments = [
      {
        id: 'assignment1',
        territory_id: 'kingston-id',
        user_id: 'rep1',
        is_active: true,
        territory: { id: 'kingston-id', name: 'Kingston' },
        user: { id: 'rep1', username: 'john.doe', email: 'john@flash.com' }
      }
    ];
    
    const mockTerritories = [
      { id: 'kingston-id', name: 'Kingston', country_id: 'JM', level: 1, is_active: true }
    ];
    
    // Setup different mocks for different queries
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'territories') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mockTerritories, error: null })
        };
      }
      if (table === 'territory_assignments') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockAssignments, error: null })
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      };
    });
    
    render(<TerritoryAssignmentManager />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Current Assignments')).toBeInTheDocument();
    });
    
    await waitFor(() => {
      expect(screen.getByText('john.doe')).toBeInTheDocument();
      expect(screen.getByText('(john@flash.com)')).toBeInTheDocument();
      expect(screen.getByText('1 territories')).toBeInTheDocument();
    });
  });

  it('removes an assignment', async () => {
    const mockAssignments = [
      {
        id: 'assignment1',
        territory_id: 'kingston-id',
        user_id: 'rep1',
        is_active: true,
        territory: { id: 'kingston-id', name: 'Kingston' },
        user: { id: 'rep1', username: 'john.doe', email: 'john@flash.com' }
      }
    ];
    
    const mockTerritories = [
      { id: 'kingston-id', name: 'Kingston', country_id: 'JM', level: 1, is_active: true }
    ];
    
    const updateMock = jest.fn().mockReturnThis();
    const eqMock = jest.fn().mockResolvedValue({ data: null, error: null });
    
    // Setup different mocks for different queries
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'territories') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockResolvedValue({ data: mockTerritories, error: null })
        };
      }
      if (table === 'territory_assignments') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: eqMock,
          update: updateMock
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: [], error: null })
      };
    });
    
    render(<TerritoryAssignmentManager />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      expect(screen.getByText('Kingston')).toBeInTheDocument();
    });
    
    // Find and click the remove button
    const removeButton = screen.getByTitle('Remove assignment');
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(updateMock).toHaveBeenCalledWith({ 
        is_active: false, 
        updated_at: expect.any(String) 
      });
    });
  });
});