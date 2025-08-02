import React from 'react';
import { render, screen } from '@testing-library/react';
import { QuickActionsWidget } from '@/components/dashboard/widgets/QuickActionsWidget';

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href }: any) => <a href={href}>{children}</a>;
});

// Mock the icons
jest.mock('@heroicons/react/24/outline', () => ({
  UserPlusIcon: () => <div data-testid="user-plus-icon">UserPlusIcon</div>,
  PhoneIcon: () => <div data-testid="phone-icon">PhoneIcon</div>,
  DocumentPlusIcon: () => <div data-testid="document-plus-icon">DocumentPlusIcon</div>,
  CalendarIcon: () => <div data-testid="calendar-icon">CalendarIcon</div>,
  EnvelopeIcon: () => <div data-testid="envelope-icon">EnvelopeIcon</div>,
  ChartBarIcon: () => <div data-testid="chart-bar-icon">ChartBarIcon</div>
}));

describe('QuickActionsWidget', () => {
  it('should render all quick action buttons', () => {
    render(<QuickActionsWidget />);

    expect(screen.getByText('Add Lead')).toBeInTheDocument();
    expect(screen.getByText('Log Call')).toBeInTheDocument();
    expect(screen.getByText('Create Proposal')).toBeInTheDocument();
    expect(screen.getByText('Schedule Meeting')).toBeInTheDocument();
    expect(screen.getByText('Send Email')).toBeInTheDocument();
    expect(screen.getByText('View Reports')).toBeInTheDocument();
  });

  it('should render all icons', () => {
    const { container } = render(<QuickActionsWidget />);

    // Check that all buttons have SVG icons
    const svgIcons = container.querySelectorAll('svg.h-6.w-6');
    expect(svgIcons).toHaveLength(6);
  });

  it('should have correct links', () => {
    const { container } = render(<QuickActionsWidget />);

    // Check specific links
    const addLeadLink = container.querySelector('a[href="/dashboard/leads?action=new"]');
    const viewReportsLink = container.querySelector('a[href="/dashboard/analytics"]');

    expect(addLeadLink).toBeInTheDocument();
    expect(viewReportsLink).toBeInTheDocument();

    // Check placeholder links
    const placeholderLinks = container.querySelectorAll('a[href="#"]');
    expect(placeholderLinks).toHaveLength(4); // Log Call, Create Proposal, Schedule Meeting, Send Email
  });

  it('should render buttons with correct structure', () => {
    const { container } = render(<QuickActionsWidget />);

    // Check button structure
    const buttons = container.querySelectorAll('button');
    expect(buttons).toHaveLength(6);

    // Check that buttons have flex-col layout
    buttons.forEach(button => {
      expect(button).toHaveClass('flex-col');
    });
  });

  it('should apply grid layout', () => {
    const { container } = render(<QuickActionsWidget />);

    const gridContainer = container.querySelector('.grid.grid-cols-2.gap-3');
    expect(gridContainer).toBeInTheDocument();
  });

  it('should have hover color classes', () => {
    const { container } = render(<QuickActionsWidget />);

    // Check for various hover color classes
    expect(container.querySelector('.hover\\:bg-blue-100')).toBeInTheDocument();
    expect(container.querySelector('.hover\\:bg-green-100')).toBeInTheDocument();
    expect(container.querySelector('.hover\\:bg-purple-100')).toBeInTheDocument();
    expect(container.querySelector('.hover\\:bg-orange-100')).toBeInTheDocument();
    expect(container.querySelector('.hover\\:bg-pink-100')).toBeInTheDocument();
    expect(container.querySelector('.hover\\:bg-indigo-100')).toBeInTheDocument();
  });

  it('should have proper button styling', () => {
    const { container } = render(<QuickActionsWidget />);

    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('w-full', 'h-auto', 'p-4');
    });
  });
});