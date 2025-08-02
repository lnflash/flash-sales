import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WeeklyGoals } from '@/components/weekly-program/WeeklyGoals';
import { useWeeklyProgramStore } from '@/stores/useWeeklyProgramStore';

// Mock the store
jest.mock('@/stores/useWeeklyProgramStore');

// Mock the icons
jest.mock('@heroicons/react/24/outline', () => ({
  PhoneIcon: () => <div data-testid="phone-icon">PhoneIcon</div>,
  UserGroupIcon: () => <div data-testid="user-group-icon">UserGroupIcon</div>,
  DocumentTextIcon: () => <div data-testid="document-text-icon">DocumentTextIcon</div>,
  ChatBubbleLeftRightIcon: () => <div data-testid="chat-bubble-icon">ChatBubbleLeftRightIcon</div>,
  UserPlusIcon: () => <div data-testid="user-plus-icon">UserPlusIcon</div>,
  PencilIcon: () => <div data-testid="pencil-icon">PencilIcon</div>,
  CheckIcon: () => <div data-testid="check-icon">CheckIcon</div>,
  XMarkIcon: () => <div data-testid="x-mark-icon">XMarkIcon</div>
}));

describe('WeeklyGoals', () => {
  const mockSetGoals = jest.fn();
  
  const defaultGoals = {
    calls: 50,
    meetings: 10,
    proposals: 5,
    followUps: 30,
    newContacts: 20
  };

  const defaultMetrics = {
    totalActivities: 20,
    completedActivities: 12,
    inProgressActivities: 5,
    completedCalls: 25,
    completedMeetings: 8,
    completedProposals: 3,
    completedFollowUps: 15,
    completionRate: 60
  };

  beforeEach(() => {
    (useWeeklyProgramStore as unknown as jest.Mock).mockReturnValue({
      goals: defaultGoals,
      setGoals: mockSetGoals,
      getWeeklyMetrics: () => defaultMetrics
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render all goal types', () => {
    render(<WeeklyGoals />);

    expect(screen.getByText('Phone Calls')).toBeInTheDocument();
    expect(screen.getByText('Meetings')).toBeInTheDocument();
    expect(screen.getByText('Proposals')).toBeInTheDocument();
    expect(screen.getByText('Follow-ups')).toBeInTheDocument();
    expect(screen.getByText('New Contacts')).toBeInTheDocument();
  });

  it('should display current progress and targets', () => {
    render(<WeeklyGoals />);

    // Phone Calls: 25/50
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument();

    // Meetings: 8/10
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    // Proposals: 3/5
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should show progress percentages', () => {
    render(<WeeklyGoals />);

    // Check for all percentage values
    const percentages = screen.getAllByText(/\d+%/);
    
    // Should have percentages for each goal type (5) plus overall progress (1)
    expect(percentages.length).toBeGreaterThanOrEqual(6);
    
    // Check that specific percentages exist
    const percentageTexts = percentages.map(el => el.textContent);
    expect(percentageTexts).toContain('50%'); // Phone Calls: 25/50
    expect(percentageTexts).toContain('80%'); // Meetings: 8/10
    expect(percentageTexts).toContain('60%'); // Overall progress and Proposals
  });

  it('should highlight completed goals', () => {
    // Update metrics to have a completed goal
    (useWeeklyProgramStore as unknown as jest.Mock).mockReturnValue({
      goals: { ...defaultGoals, meetings: 8 }, // Target matches current
      setGoals: mockSetGoals,
      getWeeklyMetrics: () => ({ ...defaultMetrics, completedMeetings: 8 })
    });

    render(<WeeklyGoals />);

    // Should show 100% for meetings
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('should enter edit mode when pencil icon is clicked', () => {
    render(<WeeklyGoals />);

    const editButton = screen.getByTitle('Edit goals');
    fireEvent.click(editButton);

    // Should show save and cancel buttons
    expect(screen.getByTitle('Save')).toBeInTheDocument();
    expect(screen.getByTitle('Cancel')).toBeInTheDocument();

    // Should show input fields
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(5);
  });

  it('should save edited goals', async () => {
    render(<WeeklyGoals />);

    // Enter edit mode
    fireEvent.click(screen.getByTitle('Edit goals'));

    // Change a goal value
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '60' } }); // Change calls goal

    // Save
    fireEvent.click(screen.getByTitle('Save'));

    await waitFor(() => {
      expect(mockSetGoals).toHaveBeenCalledWith({
        ...defaultGoals,
        calls: 60
      });
    });

    // Should exit edit mode
    expect(screen.queryByTitle('Save')).not.toBeInTheDocument();
  });

  it('should cancel editing without saving', () => {
    render(<WeeklyGoals />);

    // Enter edit mode
    fireEvent.click(screen.getByTitle('Edit goals'));

    // Change a goal value
    const inputs = screen.getAllByRole('spinbutton');
    fireEvent.change(inputs[0], { target: { value: '60' } });

    // Cancel
    fireEvent.click(screen.getByTitle('Cancel'));

    // Should not save changes
    expect(mockSetGoals).not.toHaveBeenCalled();

    // Should exit edit mode
    expect(screen.queryByTitle('Save')).not.toBeInTheDocument();
  });

  it('should display overall progress', () => {
    const { container } = render(<WeeklyGoals />);

    expect(screen.getByText('Overall Progress')).toBeInTheDocument();
    
    // Find the overall progress percentage specifically (it has text-2xl class)
    const overallProgress = container.querySelector('.text-2xl.font-bold.text-primary');
    expect(overallProgress).toBeInTheDocument();
    expect(overallProgress?.textContent).toBe('60%');
    
    expect(screen.getByText('12 of 20 activities completed')).toBeInTheDocument();
  });

  it('should render all goal icons', () => {
    const { container } = render(<WeeklyGoals />);

    // Check that all goal icons are rendered (they're SVGs with h-5 w-5 classes)
    const goalIcons = container.querySelectorAll('svg.h-5.w-5');
    expect(goalIcons).toHaveLength(5); // 5 goal types
  });

  it('should handle zero targets gracefully', () => {
    (useWeeklyProgramStore as unknown as jest.Mock).mockReturnValue({
      goals: { ...defaultGoals, calls: 0 },
      setGoals: mockSetGoals,
      getWeeklyMetrics: () => defaultMetrics
    });

    render(<WeeklyGoals />);

    // Should show 0% progress for zero target
    const progressElements = screen.getAllByText(/\d+%/);
    expect(progressElements.some(el => el.textContent === '0%')).toBe(true);
  });

  it('should apply correct styling for progress bars', () => {
    const { container } = render(<WeeklyGoals />);

    // Check for progress bar containers
    const progressBars = container.querySelectorAll('.relative.h-2.bg-muted.rounded-full');
    expect(progressBars).toHaveLength(5);

    // Check for filled progress
    const filledBars = container.querySelectorAll('.absolute.left-0.top-0.h-full');
    expect(filledBars).toHaveLength(5);
  });
});