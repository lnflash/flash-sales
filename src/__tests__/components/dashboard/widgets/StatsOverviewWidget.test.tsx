import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatsOverviewWidget } from '@/components/dashboard/widgets/StatsOverviewWidget';

// Mock the icons
jest.mock('@heroicons/react/24/outline', () => ({
  UsersIcon: () => <div data-testid="users-icon">UsersIcon</div>,
  ChartBarIcon: () => <div data-testid="chart-bar-icon">ChartBarIcon</div>,
  BanknotesIcon: () => <div data-testid="banknotes-icon">BanknotesIcon</div>,
  ArrowTrendingUpIcon: () => <div data-testid="arrow-trending-up-icon">ArrowTrendingUpIcon</div>,
  ArrowTrendingDownIcon: () => <div data-testid="arrow-trending-down-icon">ArrowTrendingDownIcon</div>
}));

describe('StatsOverviewWidget', () => {
  it('should render all stat cards', () => {
    render(<StatsOverviewWidget />);

    expect(screen.getByText('Total Leads')).toBeInTheDocument();
    expect(screen.getByText('Revenue')).toBeInTheDocument();
    expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
  });

  it('should display correct values', () => {
    render(<StatsOverviewWidget />);

    expect(screen.getByText('2,543')).toBeInTheDocument();
    expect(screen.getByText('$143,201')).toBeInTheDocument();
    expect(screen.getByText('32.5%')).toBeInTheDocument();
  });

  it('should show positive trend for leads and revenue', () => {
    render(<StatsOverviewWidget />);

    // Should show positive trends
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('+23%')).toBeInTheDocument();
  });

  it('should show negative trend for conversion rate', () => {
    render(<StatsOverviewWidget />);

    // Should show negative trend
    expect(screen.getByText('-2.1%')).toBeInTheDocument();
  });

  it('should render all icons', () => {
    const { container } = render(<StatsOverviewWidget />);

    // Check for icon SVGs
    const icons = container.querySelectorAll('svg.h-5.w-5');
    expect(icons).toHaveLength(3); // 3 stat cards
  });

  it('should render trend icons', () => {
    const { container } = render(<StatsOverviewWidget />);

    // Check for trend icon SVGs
    const trendIcons = container.querySelectorAll('svg.h-4.w-4');
    expect(trendIcons).toHaveLength(3); // 3 trend indicators
  });

  it('should apply correct styling classes', () => {
    const { container } = render(<StatsOverviewWidget />);

    // Check for grid layout
    const gridElement = container.querySelector('.grid');
    expect(gridElement).toHaveClass('grid-cols-1', 'md:grid-cols-3');

    // Check for card styling
    const cards = container.querySelectorAll('.bg-background');
    expect(cards).toHaveLength(3);
  });
});