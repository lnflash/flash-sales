import { render, screen, fireEvent } from '@testing-library/react';
import InterestChart from './InterestChart';
import { MobileMenuProvider } from '@/contexts/MobileMenuContext';

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: jest.fn(() => <div data-testid="chart">Mocked Chart</div>),
}));

// Mock Chart.js components
jest.mock('chart.js', () => ({
  Chart: {
    register: jest.fn(),
  },
  CategoryScale: jest.fn(),
  LinearScale: jest.fn(),
  PointElement: jest.fn(),
  LineElement: jest.fn(),
  Title: jest.fn(),
  Tooltip: jest.fn(),
  Legend: jest.fn(),
  Filler: jest.fn(),
}));

// Use current year to ensure filtering works
const currentYear = new Date().getFullYear();
const mockData = [
  { month: `${currentYear}-01`, count: 10 },
  { month: `${currentYear}-02`, count: 15 },
  { month: `${currentYear}-03`, count: 20 },
  { month: `${currentYear}-04`, count: 25 },
  { month: `${currentYear}-05`, count: 30 },
  { month: `${currentYear}-06`, count: 35 },
  { month: `${currentYear}-07`, count: 40 },
  { month: `${currentYear}-08`, count: 45 },
  { month: `${currentYear}-09`, count: 50 },
  { month: `${currentYear}-10`, count: 55 },
  { month: `${currentYear}-11`, count: 60 },
  { month: `${currentYear}-12`, count: 65 },
];

describe('InterestChart', () => {
  const renderWithProvider = (ui: React.ReactElement) => {
    return render(
      <MobileMenuProvider>
        {ui}
      </MobileMenuProvider>
    );
  };

  it('renders with default month selection', () => {
    renderWithProvider(<InterestChart data={mockData} />);
    
    expect(screen.getByText('Submission Trends - Monthly View')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Last 12 Months')).toBeInTheDocument();
    expect(screen.getByTestId('chart')).toBeInTheDocument();
  });

  it('changes time period when dropdown is changed', () => {
    renderWithProvider(<InterestChart data={mockData} />);
    
    const dropdown = screen.getByRole('combobox');
    
    // Change to weekly view
    fireEvent.change(dropdown, { target: { value: 'week' } });
    expect(screen.getByText('Submission Trends - Weekly View')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Last 4 Weeks')).toBeInTheDocument();
    
    // Change to yearly view
    fireEvent.change(dropdown, { target: { value: 'year' } });
    expect(screen.getByText('Submission Trends - Yearly View')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Last 3 Years')).toBeInTheDocument();
  });

  it('shows loading state when isLoading is true', () => {
    renderWithProvider(<InterestChart data={[]} isLoading={true} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  });

  it('shows no data message when filteredData is empty', () => {
    renderWithProvider(<InterestChart data={[]} isLoading={false} />);
    
    expect(screen.getByText('No data available for selected time period')).toBeInTheDocument();
    expect(screen.queryByTestId('chart')).not.toBeInTheDocument();
  });

  it('renders dropdown with correct focus styles', () => {
    renderWithProvider(<InterestChart data={mockData} />);
    
    const dropdown = screen.getByRole('combobox');
    expect(dropdown).toHaveClass('focus:ring-2', 'focus:ring-flash-green');
  });
});