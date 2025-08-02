import React from 'react';
import { render, screen } from '@testing-library/react';
import { RecentLeadsWidget } from '@/components/dashboard/widgets/RecentLeadsWidget';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock the icon
jest.mock('@heroicons/react/24/outline', () => ({
  ArrowRightIcon: () => <div data-testid="arrow-right-icon">ArrowRightIcon</div>
}));

describe('RecentLeadsWidget', () => {
  it('should render all recent leads', () => {
    render(<RecentLeadsWidget />);

    expect(screen.getByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    expect(screen.getByText('Mike Chen')).toBeInTheDocument();
    expect(screen.getByText('Emma Wilson')).toBeInTheDocument();
  });

  it('should display company names', () => {
    render(<RecentLeadsWidget />);

    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('Design Studio')).toBeInTheDocument();
    expect(screen.getByText('StartupXYZ')).toBeInTheDocument();
    expect(screen.getByText('Global Inc')).toBeInTheDocument();
  });

  it('should show lead statuses', () => {
    render(<RecentLeadsWidget />);

    expect(screen.getByText('new')).toBeInTheDocument();
    expect(screen.getByText('contacted')).toBeInTheDocument();
    expect(screen.getByText('qualified')).toBeInTheDocument();
    expect(screen.getByText('proposal')).toBeInTheDocument();
  });

  it('should display lead values', () => {
    render(<RecentLeadsWidget />);

    expect(screen.getByText('$25,000')).toBeInTheDocument();
    expect(screen.getByText('$15,000')).toBeInTheDocument();
    expect(screen.getByText('$45,000')).toBeInTheDocument();
    expect(screen.getByText('$75,000')).toBeInTheDocument();
  });

  it('should show creation times', () => {
    render(<RecentLeadsWidget />);

    expect(screen.getByText('2 hours ago')).toBeInTheDocument();
    expect(screen.getByText('4 hours ago')).toBeInTheDocument();
    expect(screen.getByText('6 hours ago')).toBeInTheDocument();
    expect(screen.getByText('1 day ago')).toBeInTheDocument();
  });

  it('should render View All Leads button', () => {
    render(<RecentLeadsWidget />);

    const viewAllButton = screen.getByText('View All Leads');
    expect(viewAllButton).toBeInTheDocument();
  });

  it('should have correct link to leads page', () => {
    const { container } = render(<RecentLeadsWidget />);

    const link = container.querySelector('a[href="/dashboard/leads"]');
    expect(link).toBeInTheDocument();
  });

  it('should render arrow icon in button', () => {
    const { container } = render(<RecentLeadsWidget />);

    // The icon is rendered inside the button
    const button = screen.getByText('View All Leads').closest('button');
    expect(button).toBeInTheDocument();
    
    // Check that the button contains the icon
    const icon = button?.querySelector('.ml-2.h-4.w-4');
    expect(icon).toBeInTheDocument();
  });

  it('should apply status-specific styling', () => {
    const { container } = render(<RecentLeadsWidget />);

    // Check for status badges with color classes
    const newBadge = screen.getByText('new').closest('div');
    const contactedBadge = screen.getByText('contacted').closest('div');
    const qualifiedBadge = screen.getByText('qualified').closest('div');
    const proposalBadge = screen.getByText('proposal').closest('div');

    expect(newBadge).toBeInTheDocument();
    expect(contactedBadge).toBeInTheDocument();
    expect(qualifiedBadge).toBeInTheDocument();
    expect(proposalBadge).toBeInTheDocument();
    
    // Check that the badges have appropriate classes
    expect(newBadge?.className).toContain('bg-blue-100');
    expect(contactedBadge?.className).toContain('bg-yellow-100');
    expect(qualifiedBadge?.className).toContain('bg-purple-100');
    expect(proposalBadge?.className).toContain('bg-green-100');
  });

  it('should have proper lead card structure', () => {
    const { container } = render(<RecentLeadsWidget />);

    // Check for lead cards
    const leadCards = container.querySelectorAll('.p-3.bg-background.rounded-lg.border');
    expect(leadCards).toHaveLength(4);

    // Check hover state class
    leadCards.forEach(card => {
      expect(card).toHaveClass('hover:border-muted-foreground');
    });
  });

  it('should have scrollable container', () => {
    const { container } = render(<RecentLeadsWidget />);

    const scrollContainer = container.querySelector('.flex-1.space-y-3.overflow-y-auto');
    expect(scrollContainer).toBeInTheDocument();
  });

  it('should have bottom border separator', () => {
    const { container } = render(<RecentLeadsWidget />);

    const separator = container.querySelector('.border-t.border-border');
    expect(separator).toBeInTheDocument();
  });
});