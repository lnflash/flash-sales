import React from 'react';
import { render, screen } from '@testing-library/react';
import { TeamLeaderboardWidget } from '@/components/dashboard/widgets/TeamLeaderboardWidget';

// Mock the icons
jest.mock('@heroicons/react/24/outline', () => ({
  TrophyIcon: () => <div data-testid="trophy-icon">TrophyIcon</div>,
  FireIcon: () => <div data-testid="fire-icon">FireIcon</div>
}));

describe('TeamLeaderboardWidget', () => {
  it('should render all team members', () => {
    render(<TeamLeaderboardWidget />);

    expect(screen.getByText('Sarah Lee')).toBeInTheDocument();
    expect(screen.getByText('Mike Chen')).toBeInTheDocument();
    expect(screen.getByText('Emma Wilson')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Lisa Park')).toBeInTheDocument();
  });

  it('should display ranking numbers', () => {
    render(<TeamLeaderboardWidget />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should show deals and revenue information', () => {
    render(<TeamLeaderboardWidget />);

    expect(screen.getByText('12 deals · $145K')).toBeInTheDocument();
    expect(screen.getByText('10 deals · $122K')).toBeInTheDocument();
    expect(screen.getByText('9 deals · $98K')).toBeInTheDocument();
    expect(screen.getByText('8 deals · $87K')).toBeInTheDocument();
    expect(screen.getByText('7 deals · $76K')).toBeInTheDocument();
  });

  it('should display trend percentages', () => {
    render(<TeamLeaderboardWidget />);

    expect(screen.getByText('+15%')).toBeInTheDocument();
    expect(screen.getByText('+8%')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('-2%')).toBeInTheDocument();
    expect(screen.getByText('+5%')).toBeInTheDocument();
  });

  it('should show trophy icon for top performer', () => {
    const { container } = render(<TeamLeaderboardWidget />);

    // Look for trophy icon by its class
    const trophyIcons = container.querySelectorAll('svg.h-4.w-4.text-yellow-500');
    expect(trophyIcons).toHaveLength(1); // Only Sarah Lee should have the trophy
  });

  it('should show fire icons for high performers', () => {
    const { container } = render(<TeamLeaderboardWidget />);

    // Fire icon should appear for trends > 10%
    const fireIcons = container.querySelectorAll('svg.h-4.w-4.text-orange-500');
    expect(fireIcons).toHaveLength(2); // Sarah Lee (+15%) and Emma Wilson (+12%)
  });

  it('should apply special styling to top performer', () => {
    const { container } = render(<TeamLeaderboardWidget />);

    // Check for highlighted background on top performer
    const topPerformerCard = container.querySelector('.bg-yellow-50');
    expect(topPerformerCard).toBeInTheDocument();
  });

  it('should apply correct color to positive trends', () => {
    render(<TeamLeaderboardWidget />);

    const positiveTrend = screen.getByText('+15%');
    expect(positiveTrend).toHaveClass('text-green-600');
  });

  it('should apply correct color to negative trends', () => {
    render(<TeamLeaderboardWidget />);

    const negativeTrend = screen.getByText('-2%');
    expect(negativeTrend).toHaveClass('text-red-600');
  });

  it('should have scrollable container', () => {
    const { container } = render(<TeamLeaderboardWidget />);

    const scrollContainer = container.querySelector('.flex-1.space-y-2.overflow-y-auto');
    expect(scrollContainer).toBeInTheDocument();
  });

  it('should render ranking badges', () => {
    const { container } = render(<TeamLeaderboardWidget />);

    // Check for ranking badge structure
    const rankBadges = container.querySelectorAll('.w-8.h-8.rounded-full.bg-muted');
    expect(rankBadges).toHaveLength(5);
  });

  it('should have proper card hover states', () => {
    const { container } = render(<TeamLeaderboardWidget />);

    // Non-top cards should have hover effect
    const regularCards = container.querySelectorAll('.hover\\:border-muted-foreground');
    expect(regularCards.length).toBeGreaterThan(0);
  });
});