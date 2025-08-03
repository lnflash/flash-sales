import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TerritoryDashboard from '../TerritoryDashboard';
import { JamaicaParish } from '@/types/lead-routing';

describe('TerritoryDashboard', () => {
  const mockSalesReps = [
    {
      id: '1',
      name: 'John Doe',
      territory: 'Kingston' as JamaicaParish,
      activeLeads: 10,
      conversionRate: 0.3
    },
    {
      id: '2',
      name: 'Jane Smith',
      territory: 'St. Andrew' as JamaicaParish,
      activeLeads: 15,
      conversionRate: 0.4
    },
    {
      id: '3',
      name: 'Bob Johnson',
      territory: 'St. James' as JamaicaParish,
      activeLeads: 8,
      conversionRate: 0.25
    },
    {
      id: '4',
      name: 'Alice Brown',
      territory: 'Kingston' as JamaicaParish,
      activeLeads: 12,
      conversionRate: 0.35
    },
    {
      id: '5',
      name: 'Charlie Davis',
      territory: 'Unassigned' as any,
      activeLeads: 5,
      conversionRate: 0.2
    }
  ];

  it('renders the component with title', () => {
    render(<TerritoryDashboard salesReps={mockSalesReps} />);
    expect(screen.getByText('Territory Management')).toBeInTheDocument();
  });

  it('renders region filter buttons', () => {
    render(<TerritoryDashboard salesReps={mockSalesReps} />);
    
    // Use role queries for buttons specifically
    const buttons = screen.getAllByRole('button');
    const buttonTexts = buttons.map(btn => btn.textContent);
    
    expect(buttonTexts).toContain('All');
    expect(buttonTexts).toContain('Eastern');
    expect(buttonTexts).toContain('Central');
    expect(buttonTexts).toContain('Western');
  });

  it('filters territories by region when clicking region buttons', () => {
    render(<TerritoryDashboard salesReps={mockSalesReps} />);
    
    // Initially shows all regions - look for territory cards by their heading text
    const headings = screen.getAllByRole('heading', { level: 4 });
    const territoryNames = headings.map(h => h.textContent);
    
    expect(territoryNames).toContain('Kingston');
    expect(territoryNames).toContain('St. Andrew');
    expect(territoryNames).toContain('St. James');
    
    // Click Eastern region button
    const buttons = screen.getAllByRole('button');
    const easternButton = buttons.find(btn => btn.textContent === 'Eastern');
    fireEvent.click(easternButton!);
    
    // Should show only Eastern parishes
    const filteredHeadings = screen.getAllByRole('heading', { level: 4 });
    const filteredTerritoryNames = filteredHeadings.map(h => h.textContent);
    
    expect(filteredTerritoryNames).toContain('Kingston');
    expect(filteredTerritoryNames).toContain('St. Andrew');
    expect(filteredTerritoryNames).not.toContain('St. James');
  });

  it('displays region summary cards when All is selected', () => {
    render(<TerritoryDashboard salesReps={mockSalesReps} />);
    
    // Should show summary cards for each region
    const activeLeadsLabels = screen.getAllByText('Active Leads');
    expect(activeLeadsLabels.length).toBeGreaterThan(0);
    
    // Should show conversion percentages
    const conversionTexts = screen.getAllByText(/conversion$/);
    expect(conversionTexts.length).toBeGreaterThan(0);
  });

  it('calculates and displays correct territory statistics', () => {
    render(<TerritoryDashboard salesReps={mockSalesReps} />);
    
    // Kingston should show combined stats (2 reps)
    const kingstonCard = screen.getByText('Kingston').closest('div[class*="p-4"]');
    expect(kingstonCard).toHaveTextContent('22'); // 10 + 12 active leads
    expect(kingstonCard).toHaveTextContent('2'); // 2 reps
  });

  it('displays top performer for each territory', () => {
    render(<TerritoryDashboard salesReps={mockSalesReps} />);
    
    // Alice Brown should be top performer in Kingston (12 leads > 10 leads)
    const kingstonCard = screen.getByText('Kingston').closest('div[class*="p-4"]');
    expect(kingstonCard).toHaveTextContent('Top: Alice Brown');
  });

  it('shows warning for territories with no assigned reps', () => {
    const repsWithGaps = [
      ...mockSalesReps.slice(0, 3), // Remove some territories to create gaps
    ];
    
    render(<TerritoryDashboard salesReps={repsWithGaps} />);
    
    expect(screen.getByText('Territory Coverage Gap')).toBeInTheDocument();
    expect(screen.getByText(/territories have no assigned reps/)).toBeInTheDocument();
  });

  it('highlights territories with capacity issues', () => {
    // Create many reps in one territory
    const repsWithCapacityIssue = [
      ...mockSalesReps,
      ...Array.from({ length: 5 }, (_, i) => ({
        id: `extra-${i}`,
        name: `Extra Rep ${i}`,
        territory: 'Kingston' as JamaicaParish,
        activeLeads: 5,
        conversionRate: 0.2
      }))
    ];
    
    render(<TerritoryDashboard salesReps={repsWithCapacityIssue} />);
    
    const kingstonCard = screen.getByText('Kingston').closest('div[class*="p-4"]');
    expect(kingstonCard).toHaveClass('border-amber-300', 'bg-amber-50');
  });

  it('calls onTerritoryClick when clicking a territory card', () => {
    const mockOnTerritoryClick = jest.fn();
    render(
      <TerritoryDashboard 
        salesReps={mockSalesReps} 
        onTerritoryClick={mockOnTerritoryClick}
      />
    );
    
    const kingstonCard = screen.getByText('Kingston').closest('div[class*="p-4"]');
    fireEvent.click(kingstonCard!);
    
    expect(mockOnTerritoryClick).toHaveBeenCalledWith('Kingston');
  });

  it('shows empty state when no territories have active leads', () => {
    const emptyReps = mockSalesReps.map(rep => ({
      ...rep,
      activeLeads: 0
    }));
    
    render(<TerritoryDashboard salesReps={emptyReps} />);
    
    expect(screen.getByText('No territories with active leads')).toBeInTheDocument();
    expect(screen.getByText('Territories will appear here once leads are assigned')).toBeInTheDocument();
  });

  it('filters out unassigned territories', () => {
    render(<TerritoryDashboard salesReps={mockSalesReps} />);
    
    // Should not show unassigned territory
    expect(screen.queryByText('Unassigned')).not.toBeInTheDocument();
  });

  it('applies correct color coding for performance levels', () => {
    render(<TerritoryDashboard salesReps={mockSalesReps} />);
    
    // Find St. Andrew card by heading
    const headings = screen.getAllByRole('heading', { level: 4 });
    const stAndrewHeading = headings.find(h => h.textContent === 'St. Andrew');
    const stAndrewCard = stAndrewHeading?.closest('div[class*="p-4"]');
    
    // Jane Smith has 100% conversion rate (2 signups out of 2)
    const conversionElement = stAndrewCard?.querySelector('[class*="text-green"]');
    expect(conversionElement).toBeInTheDocument();
    expect(conversionElement).toHaveTextContent('100%');
  });

  it('calculates conversion rate correctly for territories', () => {
    const repsWithVariedConversion = [
      {
        id: '1',
        name: 'Rep 1',
        territory: 'Portland' as JamaicaParish,
        activeLeads: 10,
        conversionRate: 0.5
      },
      {
        id: '2',
        name: 'Rep 2',
        territory: 'Portland' as JamaicaParish,
        activeLeads: 10,
        conversionRate: 0
      }
    ];
    
    render(<TerritoryDashboard salesReps={repsWithVariedConversion} />);
    
    const portlandCard = screen.getByText('Portland').closest('div[class*="p-4"]');
    // 1 rep with conversion out of 2 total = 50%
    expect(portlandCard).toHaveTextContent('50%');
  });
});