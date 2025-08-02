import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeeklyCalendar } from '@/components/weekly-program/WeeklyCalendar';
import { useWeeklyProgramStore } from '@/stores/useWeeklyProgramStore';
import { Activity } from '@/types/weekly-program';

// Mock the store
jest.mock('@/stores/useWeeklyProgramStore');

// Mock date-fns functions
jest.mock('date-fns', () => ({
  ...jest.requireActual('date-fns'),
  isToday: jest.fn(),
  startOfWeek: jest.fn((date) => {
    // Force startOfWeek to return the date itself (2024-01-15 which is a Monday)
    return new Date('2024-01-15');
  })
}));

describe('WeeklyCalendar', () => {
  const mockGetActivitiesByDate = jest.fn();
  const mockUpdateActivityStatus = jest.fn();
  const mockOnActivityClick = jest.fn();
  const mockOnAddActivity = jest.fn();

  const mockActivities: Activity[] = [
    {
      id: '1',
      userId: 'testuser',
      date: '2024-01-15',
      time: '10:00',
      type: 'call',
      title: 'Call with John Doe',
      status: 'planned',
      priority: 'high',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: '2',
      userId: 'testuser',
      date: '2024-01-15',
      time: '14:00',
      type: 'meeting',
      title: 'Meeting with Jane Smith',
      status: 'in_progress',
      priority: 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    // Mock isToday to always return false unless set otherwise
    const { isToday } = require('date-fns');
    isToday.mockReturnValue(false);

    // Monday is the first day of the week, so we need to make sure our currentWeek
    // starts on a Monday. 2024-01-15 is a Monday
    const mockStore = {
      currentWeek: '2024-01-15',
      getActivitiesByDate: mockGetActivitiesByDate,
      updateActivityStatus: mockUpdateActivityStatus
    };

    (useWeeklyProgramStore as unknown as jest.Mock).mockReturnValue(mockStore);
    
    // Make sure activities are returned for the correct date
    mockGetActivitiesByDate.mockImplementation((date: string) => {
      // Monday 2024-01-15 should have activities
      if (date === '2024-01-15') {
        return mockActivities;
      }
      return [];
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render 7 days of the week', () => {
    render(
      <WeeklyCalendar 
        onActivityClick={mockOnActivityClick}
        onAddActivity={mockOnAddActivity}
      />
    );

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    weekDays.forEach(day => {
      expect(screen.getByText(day)).toBeInTheDocument();
    });
  });

  it('should display activities for the correct date', () => {
    render(
      <WeeklyCalendar 
        onActivityClick={mockOnActivityClick}
        onAddActivity={mockOnAddActivity}
      />
    );

    expect(screen.getByText('Call with John Doe')).toBeInTheDocument();
    expect(screen.getByText('Meeting with Jane Smith')).toBeInTheDocument();
  });

  it('should call onActivityClick when an activity is clicked', () => {
    render(
      <WeeklyCalendar 
        onActivityClick={mockOnActivityClick}
        onAddActivity={mockOnAddActivity}
      />
    );

    fireEvent.click(screen.getByText('Call with John Doe'));
    expect(mockOnActivityClick).toHaveBeenCalledWith(mockActivities[0]);
  });

  it('should show add activity button for each day', () => {
    const { container } = render(
      <WeeklyCalendar 
        onActivityClick={mockOnActivityClick}
        onAddActivity={mockOnAddActivity}
      />
    );

    // Find buttons with PlusIcon
    const addButtons = container.querySelectorAll('button[title="Add activity"]');
    expect(addButtons).toHaveLength(7); // One for each day
  });

  it('should call onAddActivity with the correct date when add button is clicked', () => {
    const { container } = render(
      <WeeklyCalendar 
        onActivityClick={mockOnActivityClick}
        onAddActivity={mockOnAddActivity}
      />
    );

    const addButtons = container.querySelectorAll('button[title="Add activity"]');
    // The first button might be Sunday due to locale settings
    // Find Monday's button by checking the day label
    const mondaySection = screen.getByText('Monday').closest('div')?.parentElement;
    const mondayAddButton = mondaySection?.querySelector('button[title="Add activity"]');
    
    if (mondayAddButton) {
      fireEvent.click(mondayAddButton);
    }
    
    expect(mockOnAddActivity).toHaveBeenCalledWith('2024-01-15');
  });

  it('should show activity status icons', () => {
    const { container } = render(
      <WeeklyCalendar 
        onActivityClick={mockOnActivityClick}
        onAddActivity={mockOnAddActivity}
      />
    );

    // The in_progress activity should have a clock icon
    const statusIcons = container.querySelectorAll('svg.h-4.w-4.text-blue-600, svg.h-4.w-4.text-green-600');
    expect(statusIcons.length).toBeGreaterThan(0);
  });

  it('should display activity counts for each day', () => {
    render(
      <WeeklyCalendar 
        onActivityClick={mockOnActivityClick}
        onAddActivity={mockOnAddActivity}
      />
    );

    // Find Monday's section and check its activity count
    const mondaySection = screen.getByText('Monday').closest('div')?.parentElement?.parentElement;
    if (mondaySection) {
      // Look for the text within the entire Monday section
      const activityCountText = mondaySection.textContent;
      expect(activityCountText).toContain('2 activities');
    }
  });

  it('should show "No activities" for empty days', () => {
    render(
      <WeeklyCalendar 
        onActivityClick={mockOnActivityClick}
        onAddActivity={mockOnAddActivity}
      />
    );

    // Other days should show "No activities"
    const noActivitiesElements = screen.getAllByText('No activities');
    expect(noActivitiesElements.length).toBeGreaterThan(0);
  });

  it('should highlight today', () => {
    // Import and mock isToday from date-fns
    const { isToday } = require('date-fns');
    isToday.mockImplementation((date) => {
      return date.toISOString().startsWith('2024-01-15');
    });

    const { container } = render(
      <WeeklyCalendar 
        onActivityClick={mockOnActivityClick}
        onAddActivity={mockOnAddActivity}
      />
    );

    // Check for the special styling on today's date
    const todayElement = container.querySelector('.bg-primary\\/5');
    expect(todayElement).toBeInTheDocument();
  });
});