import { render, screen } from '@testing-library/react';
import StatsCard from './StatsCard';
import { UsersIcon } from '@heroicons/react/24/outline';

describe('StatsCard Component', () => {
  it('renders without crashing', () => {
    render(
      <StatsCard
        title="Test Title"
        value="100"
        icon={<UsersIcon data-testid="test-icon" />}
      />
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });
  
  it('displays change values when provided', () => {
    render(
      <StatsCard
        title="Test with Change"
        value="200"
        icon={<UsersIcon />}
        change={{ value: 15, positive: true }}
      />
    );
    
    expect(screen.getByText('+15%')).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });
  
  it('shows negative change values correctly', () => {
    render(
      <StatsCard
        title="Test with Change"
        value="200"
        icon={<UsersIcon />}
        change={{ value: 10, positive: false }}
      />
    );
    
    expect(screen.getByText('-10%')).toBeInTheDocument();
  });
  
  it('applies the correct color class', () => {
    const { container, rerender } = render(
      <StatsCard
        title="Green Card"
        value="300"
        icon={<UsersIcon />}
        color="green"
      />
    );
    
    expect(container.querySelector('.bg-flash-green\\/10')).toBeInTheDocument();
    
    rerender(
      <StatsCard
        title="Yellow Card"
        value="300"
        icon={<UsersIcon />}
        color="yellow"
      />
    );
    
    expect(container.querySelector('.bg-flash-yellow\\/10')).toBeInTheDocument();
  });
});