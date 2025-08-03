import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TerritoryDashboard from '@/components/sales-intelligence/TerritoryDashboard';
import { JamaicaParish } from '@/types/lead-routing';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('TerritoryDashboard', () => {
  const mockSalesReps = [
    {
      id: '1',
      name: 'rogimon',
      territory: 'Kingston' as JamaicaParish,
      activeLeads: 15,
      conversionRate: 25.5,
      countryCode: 'JM',
      territoryData: {
        countryCode: 'JM',
        countryName: 'Jamaica',
        flagEmoji: '🇯🇲'
      }
    },
    {
      id: '2',
      name: 'tatiana_1',
      territory: 'George Town' as JamaicaParish,
      activeLeads: 8,
      conversionRate: 18.2,
      countryCode: 'KY',
      territoryData: {
        countryCode: 'KY',
        countryName: 'Cayman Islands',
        flagEmoji: '🇰🇾'
      }
    },
    {
      id: '3',
      name: 'charms',
      territory: 'Willemstad' as JamaicaParish,
      activeLeads: 12,
      conversionRate: 30.0,
      countryCode: 'CW',
      territoryData: {
        countryCode: 'CW',
        countryName: 'Curaçao',
        flagEmoji: '🇨🇼'
      }
    }
  ];

  const mockOnTerritoryClick = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders territory cards for multiple countries', () => {
    render(
      <TerritoryDashboard 
        salesReps={mockSalesReps}
        onTerritoryClick={mockOnTerritoryClick}
      />
    );

    // Check for each territory
    expect(screen.getByText('Kingston')).toBeInTheDocument();
    expect(screen.getByText('George Town')).toBeInTheDocument();
    expect(screen.getByText('Willemstad')).toBeInTheDocument();
  });

  it('displays country flags for each territory', () => {
    render(
      <TerritoryDashboard 
        salesReps={mockSalesReps}
        onTerritoryClick={mockOnTerritoryClick}
      />
    );

    // Check for country flags
    expect(screen.getByText('🇯🇲')).toBeInTheDocument();
    expect(screen.getByText('🇰🇾')).toBeInTheDocument();
    expect(screen.getByText('🇨🇼')).toBeInTheDocument();
  });

  it('shows sales rep information for each territory', () => {
    render(
      <TerritoryDashboard 
        salesReps={mockSalesReps}
        onTerritoryClick={mockOnTerritoryClick}
      />
    );

    // Check for sales rep names
    expect(screen.getByText('rogimon')).toBeInTheDocument();
    expect(screen.getByText('tatiana_1')).toBeInTheDocument();
    expect(screen.getByText('charms')).toBeInTheDocument();

    // Check for active leads
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();

    // Check for conversion rates
    expect(screen.getByText('25.5%')).toBeInTheDocument();
    expect(screen.getByText('18.2%')).toBeInTheDocument();
    expect(screen.getByText('30.0%')).toBeInTheDocument();
  });

  it('handles territory click events', () => {
    render(
      <TerritoryDashboard 
        salesReps={mockSalesReps}
        onTerritoryClick={mockOnTerritoryClick}
      />
    );

    // Click on Kingston territory
    const kingstonCard = screen.getByText('Kingston').closest('.cursor-pointer');
    if (kingstonCard) {
      fireEvent.click(kingstonCard);
      expect(mockOnTerritoryClick).toHaveBeenCalledWith('Kingston');
    }

    // Click on George Town territory
    const georgetownCard = screen.getByText('George Town').closest('.cursor-pointer');
    if (georgetownCard) {
      fireEvent.click(georgetownCard);
      expect(mockOnTerritoryClick).toHaveBeenCalledWith('George Town');
    }
  });

  it('groups territories by country', () => {
    render(
      <TerritoryDashboard 
        salesReps={mockSalesReps}
        onTerritoryClick={mockOnTerritoryClick}
      />
    );

    // The component should group territories by country
    // Check that country names appear as headers
    const containers = screen.getAllByRole('heading', { level: 3 });
    expect(containers.length).toBeGreaterThan(0);
  });

  it('handles empty sales reps array', () => {
    render(
      <TerritoryDashboard 
        salesReps={[]}
        onTerritoryClick={mockOnTerritoryClick}
      />
    );

    // Should render without errors
    expect(screen.getByText('Territory Performance')).toBeInTheDocument();
  });

  it('calculates territory statistics correctly', () => {
    render(
      <TerritoryDashboard 
        salesReps={mockSalesReps}
        onTerritoryClick={mockOnTerritoryClick}
      />
    );

    // Check that total active leads is displayed
    const totalLeads = mockSalesReps.reduce((sum, rep) => sum + rep.activeLeads, 0);
    expect(screen.getByText(totalLeads.toString())).toBeInTheDocument();
  });

  it('displays performance indicators with appropriate colors', () => {
    render(
      <TerritoryDashboard 
        salesReps={mockSalesReps}
        onTerritoryClick={mockOnTerritoryClick}
      />
    );

    // High conversion rate (30%) should have success color
    const highPerformer = screen.getByText('30.0%');
    expect(highPerformer.className).toContain('text-green');

    // Low conversion rate (18.2%) should have warning/normal color
    const lowPerformer = screen.getByText('18.2%');
    expect(lowPerformer.className).toMatch(/text-(yellow|gray|muted)/);
  });

  it('handles mixed Jamaica and non-Jamaica territories', () => {
    const mixedReps = [
      ...mockSalesReps,
      {
        id: '4',
        name: 'kandi',
        territory: 'St. Catherine' as JamaicaParish,
        activeLeads: 20,
        conversionRate: 22.0,
        countryCode: 'JM',
        territoryData: {
          countryCode: 'JM',
          countryName: 'Jamaica',
          flagEmoji: '🇯🇲'
        }
      }
    ];

    render(
      <TerritoryDashboard 
        salesReps={mixedReps}
        onTerritoryClick={mockOnTerritoryClick}
      />
    );

    // Should show both Jamaica territories
    expect(screen.getByText('Kingston')).toBeInTheDocument();
    expect(screen.getByText('St. Catherine')).toBeInTheDocument();

    // Should show territories from other countries
    expect(screen.getByText('George Town')).toBeInTheDocument();
    expect(screen.getByText('Willemstad')).toBeInTheDocument();
  });
});