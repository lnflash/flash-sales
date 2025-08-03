import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import IntakeForm from '@/components/intake/IntakeForm';
import { getUserFromStorage } from '@/lib/auth';
import * as api from '@/lib/api';

// Mock dependencies
jest.mock('@/lib/auth');
jest.mock('@/lib/api');
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    query: {},
  }),
}));

// Mock SubmissionSearch to avoid role permission errors
jest.mock('@/components/intake/SubmissionSearch', () => ({
  __esModule: true,
  default: () => null,
}));

// Mock the territory and country selector components
jest.mock('@/components/territories/TerritorySelector', () => ({
  TerritorySelector: ({ value, onChange, countryCode, placeholder }: any) => (
    <select 
      data-testid="territory-selector"
      value={value} 
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">{placeholder}</option>
      {countryCode === 'JM' && (
        <>
          <option value="kingston-id">Kingston</option>
          <option value="st-andrew-id">St. Andrew</option>
        </>
      )}
      {countryCode === 'KY' && (
        <>
          <option value="george-town-id">George Town</option>
          <option value="west-bay-id">West Bay</option>
        </>
      )}
      {countryCode === 'CW' && (
        <>
          <option value="willemstad-id">Willemstad</option>
          <option value="bandabou-id">Bandabou</option>
        </>
      )}
    </select>
  ),
}));

jest.mock('@/components/territories/CountrySelector', () => ({
  CountrySelector: ({ value, onChange }: any) => (
    <select 
      data-testid="country-selector"
      value={value} 
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="JM">Jamaica</option>
      <option value="KY">Cayman Islands</option>
      <option value="CW">Curaçao</option>
    </select>
  ),
}));

// Mock the mobile menu context
jest.mock('@/contexts/MobileMenuContext', () => ({
  useMobileMenu: () => ({ isMobile: false }),
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

describe('IntakeForm Territory Selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getUserFromStorage as jest.Mock).mockReturnValue({
      username: 'testuser',
      role: 'sales_rep'
    });
  });

  it('renders country and territory selectors', () => {
    render(<IntakeForm />, { wrapper: createWrapper() });
    
    expect(screen.getByTestId('country-selector')).toBeInTheDocument();
    expect(screen.getByTestId('territory-selector')).toBeInTheDocument();
  });

  it('defaults to Jamaica as the selected country', () => {
    render(<IntakeForm />, { wrapper: createWrapper() });
    
    const countrySelector = screen.getByTestId('country-selector') as HTMLSelectElement;
    expect(countrySelector.value).toBe('JM');
  });

  it('updates territory options when country changes', () => {
    render(<IntakeForm />, { wrapper: createWrapper() });
    
    const countrySelector = screen.getByTestId('country-selector');
    const territorySelector = screen.getByTestId('territory-selector');
    
    // Initially shows Jamaica territories
    expect(screen.getByText('Kingston')).toBeInTheDocument();
    expect(screen.getByText('St. Andrew')).toBeInTheDocument();
    
    // Change to Cayman Islands
    fireEvent.change(countrySelector, { target: { value: 'KY' } });
    
    // Should show Cayman territories
    expect(screen.getByText('George Town')).toBeInTheDocument();
    expect(screen.getByText('West Bay')).toBeInTheDocument();
    expect(screen.queryByText('Kingston')).not.toBeInTheDocument();
  });

  it('resets territory selection when country changes', () => {
    render(<IntakeForm />, { wrapper: createWrapper() });
    
    const countrySelector = screen.getByTestId('country-selector');
    const territorySelector = screen.getByTestId('territory-selector') as HTMLSelectElement;
    
    // Select a Jamaica territory
    fireEvent.change(territorySelector, { target: { value: 'kingston-id' } });
    expect(territorySelector.value).toBe('kingston-id');
    
    // Change country
    fireEvent.change(countrySelector, { target: { value: 'KY' } });
    
    // Territory should be reset
    expect(territorySelector.value).toBe('');
  });

  it('includes territoryId in form submission', async () => {
    const mockCreateSubmission = jest.spyOn(api, 'createSubmission');
    mockCreateSubmission.mockResolvedValue({
      id: '123',
      ownerName: 'Test Business',
      territoryId: 'george-town-id',
      territoryData: {
        id: 'george-town-id',
        name: 'George Town',
        type: 'district',
        countryCode: 'KY',
        countryName: 'Cayman Islands',
        flagEmoji: '🇰🇾',
        fullPath: 'Cayman Islands > George Town'
      }
    } as any);

    render(<IntakeForm />, { wrapper: createWrapper() });
    
    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Business Name/i), {
      target: { value: 'Test Business' }
    });
    
    // Select lead status
    fireEvent.click(screen.getByText('Canvas'));
    
    // Change country and select territory
    const countrySelector = screen.getByTestId('country-selector');
    const territorySelector = screen.getByTestId('territory-selector');
    
    fireEvent.change(countrySelector, { target: { value: 'KY' } });
    fireEvent.change(territorySelector, { target: { value: 'george-town-id' } });
    
    // Submit form
    const submitButton = screen.getByRole('button', { name: /Submit Lead/i });
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockCreateSubmission).toHaveBeenCalledWith(
        expect.objectContaining({
          countryCode: 'KY',
          territoryId: 'george-town-id'
        })
      );
    });
  });

  it('loads territory data when editing existing submission', async () => {
    const mockGetSubmissionById = jest.spyOn(api, 'getSubmissionById');
    mockGetSubmissionById.mockResolvedValue({
      id: '123',
      ownerName: 'Existing Business',
      territoryId: 'willemstad-id',
      territoryData: {
        id: 'willemstad-id',
        name: 'Willemstad',
        type: 'district',
        countryCode: 'CW',
        countryName: 'Curaçao',
        flagEmoji: '🇨🇼',
        fullPath: 'Curaçao > Willemstad'
      },
      territory: 'Willemstad', // Legacy field
      phoneNumber: '',
      packageSeen: false,
      decisionMakers: '',
      interestLevel: 3,
      signedUp: false,
      specificNeeds: '',
      username: 'testuser',
      timestamp: new Date().toISOString()
    });

    render(<IntakeForm submissionId="123" />, { wrapper: createWrapper() });
    
    await waitFor(() => {
      const countrySelector = screen.getByTestId('country-selector') as HTMLSelectElement;
      const territorySelector = screen.getByTestId('territory-selector') as HTMLSelectElement;
      
      expect(countrySelector.value).toBe('CW');
      expect(territorySelector.value).toBe('willemstad-id');
    });
  });
});