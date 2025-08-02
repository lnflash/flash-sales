import React from 'react';
import { render, screen } from '@testing-library/react';
import { PerformanceChartWidget } from '@/components/dashboard/widgets/PerformanceChartWidget';

describe('PerformanceChartWidget', () => {
  it('should render the performance chart', () => {
    render(<PerformanceChartWidget />);

    // Check for legend
    expect(screen.getByText('Leads')).toBeInTheDocument();
    expect(screen.getByText('Conversions')).toBeInTheDocument();
  });

  it('should display all months', () => {
    render(<PerformanceChartWidget />);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    months.forEach(month => {
      expect(screen.getByText(month)).toBeInTheDocument();
    });
  });

  it('should show conversion rate', () => {
    render(<PerformanceChartWidget />);

    expect(screen.getByText('Conversion Rate')).toBeInTheDocument();
    // June data: 32 conversions / 72 leads = 44%
    expect(screen.getByText('44%')).toBeInTheDocument();
  });

  it('should render chart bars with proper titles', () => {
    const { container } = render(<PerformanceChartWidget />);

    // Check for bars with titles
    const leadsBars = container.querySelectorAll('[title*="leads"]');
    const conversionBars = container.querySelectorAll('[title*="conversions"]');

    expect(leadsBars).toHaveLength(6);
    expect(conversionBars).toHaveLength(6);
  });

  it('should render legend indicators', () => {
    const { container } = render(<PerformanceChartWidget />);

    // Check for colored indicators
    const blueIndicator = container.querySelector('.bg-blue-500.rounded-full');
    const greenIndicator = container.querySelector('.bg-green-500.rounded-full');

    expect(blueIndicator).toBeInTheDocument();
    expect(greenIndicator).toBeInTheDocument();
  });

  it('should apply correct styling', () => {
    const { container } = render(<PerformanceChartWidget />);

    // Check for chart container
    const chartContainer = container.querySelector('.flex-1.flex.items-end.gap-2');
    expect(chartContainer).toBeInTheDocument();

    // Check for month labels
    const monthLabels = container.querySelectorAll('.text-xs.text-muted-foreground');
    expect(monthLabels).toHaveLength(6);
  });

  it('should display data visualization bars', () => {
    const { container } = render(<PerformanceChartWidget />);

    // Check for lead bars (blue)
    const leadBars = container.querySelectorAll('.bg-blue-500.rounded-t-sm');
    expect(leadBars).toHaveLength(6);

    // Check for conversion bars (green)
    const conversionBars = container.querySelectorAll('.bg-green-500.rounded-t-sm');
    expect(conversionBars).toHaveLength(6);
  });

  it('should have proper chart structure', () => {
    const { container } = render(<PerformanceChartWidget />);

    // Check for main container
    expect(container.querySelector('.h-full.flex.flex-col')).toBeInTheDocument();

    // Check for border separator
    expect(container.querySelector('.border-t.border-border')).toBeInTheDocument();
  });
});