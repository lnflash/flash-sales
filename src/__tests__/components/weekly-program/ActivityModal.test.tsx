import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActivityModal } from '@/components/weekly-program/ActivityModal';
import { useWeeklyProgramStore } from '@/stores/useWeeklyProgramStore';
import { useCRMEntities } from '@/hooks/useCRMEntities';

// Mock dependencies
jest.mock('@/stores/useWeeklyProgramStore');
jest.mock('@/hooks/useCRMEntities');

describe('ActivityModal', () => {
  const mockAddActivity = jest.fn();
  const mockUpdateActivity = jest.fn();
  const mockOnClose = jest.fn();

  const mockActivity = {
    id: '1',
    userId: 'testuser',
    type: 'call' as const,
    title: 'Test Call',
    description: 'Test description',
    date: '2024-01-15',
    time: '10:00',
    duration: 30,
    priority: 'high' as const,
    organizationId: '123',
    entityName: 'John Doe',
    status: 'planned' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockEntities = [
    {
      id: '123',
      type: 'organization' as const,
      name: 'John Doe',
      subtitle: 'Technology',
      icon: 'building' as const
    }
  ];

  beforeEach(() => {
    (useWeeklyProgramStore as unknown as jest.Mock).mockReturnValue({
      addActivity: mockAddActivity,
      updateActivity: mockUpdateActivity,
      customActivityTypes: ['Sales Call', 'Site Visit']
    });

    (useCRMEntities as jest.Mock).mockReturnValue({
      entities: mockEntities,
      isLoading: false
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render when isOpen is true', () => {
    render(
      <ActivityModal 
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Check for the header text
    expect(screen.getByRole('heading', { name: 'Add Activity' })).toBeInTheDocument();
  });

  it('should not render when isOpen is false', () => {
    render(
      <ActivityModal 
        isOpen={false}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Add Activity')).not.toBeInTheDocument();
  });

  it('should render edit mode when activity is provided', () => {
    render(
      <ActivityModal 
        isOpen={true}
        onClose={mockOnClose}
        activity={mockActivity}
      />
    );

    expect(screen.getByText('Edit Activity')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Call')).toBeInTheDocument();
  });

  it('should handle activity type selection', () => {
    render(
      <ActivityModal 
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const meetingButton = screen.getByText('Meeting');
    fireEvent.click(meetingButton);

    // The button should be selected (has different styling)
    expect(meetingButton.closest('button')).toHaveClass('border-primary');
  });

  it('should show custom activity type input when custom is selected', () => {
    render(
      <ActivityModal 
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const customButton = screen.getByText('Custom');
    fireEvent.click(customButton);

    expect(screen.getByPlaceholderText('Enter custom activity type...')).toBeInTheDocument();
  });

  it('should show entity selector with recent entities', () => {
    render(
      <ActivityModal 
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Find the label first
    const entityLabel = screen.getByText('Related Entity');
    expect(entityLabel).toBeInTheDocument();
    
    // The EntitySelector should show the search input placeholder
    expect(screen.getByPlaceholderText('Search organizations, contacts, or deals...')).toBeInTheDocument();
  });

  it('should handle form submission for new activity', async () => {
    const { container } = render(
      <ActivityModal 
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Fill in the form - find the title input (it's required and not in a conditional section)
    const titleLabel = screen.getByText('Title', { selector: 'label' });
    const titleInput = titleLabel.parentElement?.querySelector('input[type="text"]');
    if (titleInput) {
      fireEvent.change(titleInput, {
        target: { value: 'New Activity' }
      });
    }

    const dateInput = container.querySelector('input[type="date"]');
    if (dateInput) {
      fireEvent.change(dateInput, {
        target: { value: '2024-01-20' }
      });
    }

    const timeInput = container.querySelector('input[type="time"]');
    if (timeInput) {
      fireEvent.change(timeInput, {
        target: { value: '14:00' }
      });
    }

    // Select priority - find the priority select
    const priorityLabel = screen.getByText('Priority', { selector: 'label' });
    const prioritySelect = priorityLabel.parentElement?.querySelector('select');
    if (prioritySelect) {
      fireEvent.change(prioritySelect, { target: { value: 'high' } });
    }

    // Submit form - get the button, not the header
    const submitButton = screen.getByRole('button', { name: 'Add Activity' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAddActivity).toHaveBeenCalledWith(expect.objectContaining({
        title: 'New Activity',
        date: '2024-01-20',
        time: '14:00',
        priority: 'high'
      }));
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should handle form submission for updating activity', async () => {
    const { container } = render(
      <ActivityModal 
        isOpen={true}
        onClose={mockOnClose}
        activity={mockActivity}
      />
    );

    // Change the title
    const titleLabel = screen.getByText('Title', { selector: 'label' });
    const titleInput = titleLabel.parentElement?.querySelector('input[type="text"]');
    if (titleInput) {
      fireEvent.change(titleInput, {
        target: { value: 'Updated Activity' }
      });
    }

    // Submit form
    fireEvent.click(screen.getByText('Update Activity'));

    await waitFor(() => {
      expect(mockUpdateActivity).toHaveBeenCalledWith(
        '1',
        expect.objectContaining({
          title: 'Updated Activity'
        })
      );
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should close modal when close button is clicked', () => {
    render(
      <ActivityModal 
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: '' }); // X button
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should validate required fields', async () => {
    render(
      <ActivityModal 
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: 'Add Activity' });
    fireEvent.click(submitButton);

    // Form should not submit if title is empty
    expect(mockAddActivity).not.toHaveBeenCalled();
  });

  it('should show recently used custom activity types', () => {
    const { container } = render(
      <ActivityModal 
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    // Select custom type
    fireEvent.click(screen.getByText('Custom'));

    // Recently used types should be in the datalist
    const datalist = container.querySelector('#custom-activity-suggestions');
    expect(datalist).toBeInTheDocument();
    
    const options = datalist?.querySelectorAll('option');
    expect(options).toHaveLength(2);
    expect(options?.[0]).toHaveAttribute('value', 'Sales Call');
    expect(options?.[1]).toHaveAttribute('value', 'Site Visit');
  });
});