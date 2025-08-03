import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityDetails } from '@/components/weekly-program/ActivityDetails';
import { useWeeklyProgramStore } from '@/stores/useWeeklyProgramStore';
import { Activity } from '@/types/weekly-program';
import { format } from 'date-fns';

// Mock the store
jest.mock('@/stores/useWeeklyProgramStore');

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    if (formatStr === 'EEEE, MMM d, yyyy') return 'Monday, Jan 15, 2024';
    if (formatStr === 'yyyy-MM-dd') return '2024-01-16';
    return '';
  })
}));

// Mock the icons - remove this to let real icons render

describe('ActivityDetails', () => {
  const mockUpdateActivity = jest.fn();
  const mockDeleteActivity = jest.fn();
  const mockDuplicateActivity = jest.fn();
  const mockUpdateActivityStatus = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnEdit = jest.fn();

  const mockActivity: Activity = {
    id: '1',
    userId: 'testuser',
    type: 'call',
    title: 'Test Call Activity',
    description: 'Test description',
    date: '2024-01-15',
    time: '10:00',
    duration: 30,
    priority: 'high',
    organizationId: '123',
    entityName: 'John Doe',
    status: 'planned',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  beforeEach(() => {
    (useWeeklyProgramStore as unknown as jest.Mock).mockReturnValue({
      updateActivity: mockUpdateActivity,
      deleteActivity: mockDeleteActivity,
      duplicateActivity: mockDuplicateActivity,
      updateActivityStatus: mockUpdateActivityStatus
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <ActivityDetails
        activity={mockActivity}
        isOpen={false}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render activity details when isOpen is true', () => {
    render(
      <ActivityDetails
        activity={mockActivity}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Test Call Activity')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('Monday, Jan 15, 2024 at 10:00')).toBeInTheDocument();
    expect(screen.getByText('High Priority')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should show Start Activity button for planned activities', () => {
    render(
      <ActivityDetails
        activity={mockActivity}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Start Activity')).toBeInTheDocument();
  });

  it('should start activity when Start Activity is clicked', () => {
    render(
      <ActivityDetails
        activity={mockActivity}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    fireEvent.click(screen.getByText('Start Activity'));
    expect(mockUpdateActivityStatus).toHaveBeenCalledWith('1', 'in_progress');
  });

  it('should show Complete and Cancel buttons for in-progress activities', () => {
    const inProgressActivity = { ...mockActivity, status: 'in_progress' as const };
    
    render(
      <ActivityDetails
        activity={inProgressActivity}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Complete')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should complete activity when Complete is clicked', () => {
    const inProgressActivity = { ...mockActivity, status: 'in_progress' as const };
    
    render(
      <ActivityDetails
        activity={inProgressActivity}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    fireEvent.click(screen.getByText('Complete'));
    expect(mockUpdateActivityStatus).toHaveBeenCalledWith('1', 'completed');
  });

  it('should show outcome and next steps fields for completed activities', () => {
    const completedActivity = { ...mockActivity, status: 'completed' as const };
    
    render(
      <ActivityDetails
        activity={completedActivity}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    expect(screen.getByText('Outcome / Notes')).toBeInTheDocument();
    expect(screen.getByText('Next Steps')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What was the result of this activity?')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('What should happen next?')).toBeInTheDocument();
  });

  it('should save outcome and next steps on blur', async () => {
    const completedActivity = { ...mockActivity, status: 'completed' as const };
    
    render(
      <ActivityDetails
        activity={completedActivity}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    const outcomeTextarea = screen.getByPlaceholderText('What was the result of this activity?');
    fireEvent.change(outcomeTextarea, { target: { value: 'Test outcome' } });
    fireEvent.blur(outcomeTextarea);

    await waitFor(() => {
      expect(mockUpdateActivity).toHaveBeenCalledWith('1', {
        outcome: 'Test outcome',
        nextSteps: ''
      });
    });
  });

  it('should call onEdit when Edit button is clicked', () => {
    render(
      <ActivityDetails
        activity={mockActivity}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    fireEvent.click(screen.getByText('Edit'));
    expect(mockOnEdit).toHaveBeenCalled();
  });

  it('should duplicate activity when Duplicate button is clicked', () => {
    render(
      <ActivityDetails
        activity={mockActivity}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    fireEvent.click(screen.getByText('Duplicate'));
    expect(mockDuplicateActivity).toHaveBeenCalledWith('1', '2024-01-16');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show delete confirmation when Delete button is clicked', () => {
    const { container } = render(
      <ActivityDetails
        activity={mockActivity}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    // Find the Delete button by looking for the button that contains 'Delete' text
    const deleteButtons = container.querySelectorAll('button');
    let deleteButton: HTMLElement | null = null;
    deleteButtons.forEach(button => {
      if (button.textContent?.includes('Delete') && !button.textContent?.includes('Delete Activity')) {
        deleteButton = button;
      }
    });
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }
    
    expect(screen.getByText('Are you sure you want to delete this activity? This action cannot be undone.')).toBeInTheDocument();
    expect(screen.getByText('Delete Activity')).toBeInTheDocument();
  });

  it('should delete activity when confirmed', () => {
    const { container } = render(
      <ActivityDetails
        activity={mockActivity}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    // Show confirmation - find the Delete button
    const deleteButtons = container.querySelectorAll('button');
    let deleteButton: HTMLElement | null = null;
    deleteButtons.forEach(button => {
      if (button.textContent?.includes('Delete') && !button.textContent?.includes('Delete Activity')) {
        deleteButton = button;
      }
    });
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }
    
    // Confirm delete
    fireEvent.click(screen.getByText('Delete Activity'));
    
    expect(mockDeleteActivity).toHaveBeenCalledWith('1');
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should cancel delete when Cancel is clicked', () => {
    const { container } = render(
      <ActivityDetails
        activity={mockActivity}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    // Show confirmation - find the Delete button
    const deleteButtons = container.querySelectorAll('button');
    let deleteButton: HTMLElement | null = null;
    deleteButtons.forEach(button => {
      if (button.textContent?.includes('Delete') && !button.textContent?.includes('Delete Activity')) {
        deleteButton = button;
      }
    });
    
    if (deleteButton) {
      fireEvent.click(deleteButton);
    }
    
    // Cancel delete - find the Cancel button
    fireEvent.click(screen.getByText('Cancel'));
    
    // Confirmation should disappear
    expect(screen.queryByText('Are you sure you want to delete this activity?')).not.toBeInTheDocument();
    expect(mockDeleteActivity).not.toHaveBeenCalled();
  });

  it('should close modal when X button is clicked', () => {
    const { container } = render(
      <ActivityDetails
        activity={mockActivity}
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
      />
    );

    // Find the close button by looking for the XMarkIcon
    const closeButton = container.querySelector('button svg.h-5.w-5.text-muted-foreground')?.parentElement;
    if (closeButton) {
      fireEvent.click(closeButton);
    }
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display correct status for different activity states', () => {
    const statuses = ['cancelled', 'rescheduled'] as const;
    
    statuses.forEach(status => {
      const { rerender } = render(
        <ActivityDetails
          activity={{ ...mockActivity, status }}
          isOpen={true}
          onClose={mockOnClose}
          onEdit={mockOnEdit}
        />
      );

      if (status === 'cancelled') {
        expect(screen.getByText('Cancelled')).toBeInTheDocument();
      } else if (status === 'rescheduled') {
        expect(screen.getByText('Rescheduled')).toBeInTheDocument();
      }

      rerender(<div />); // Clear for next iteration
    });
  });
});