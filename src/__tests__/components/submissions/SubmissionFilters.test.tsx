import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SubmissionFilters from '@/components/submissions/SubmissionFilters';
import { SubmissionFilters as SubmissionFiltersType } from '@/types/submission';

describe('SubmissionFilters Component', () => {
  const mockOnFilterChange = jest.fn();
  const mockOnResetFilters = jest.fn();

  const defaultProps = {
    filters: {} as SubmissionFiltersType,
    onFilterChange: mockOnFilterChange,
    onResetFilters: mockOnResetFilters,
  };

  beforeEach(() => {
    mockOnFilterChange.mockClear();
    mockOnResetFilters.mockClear();
  });

  const clickFiltersButton = () => {
    const filterButton = screen.getByRole('button', { name: /filters/i });
    fireEvent.click(filterButton);
  };

  describe('Search Functionality', () => {
    it('should update search input and trigger filter change on submit', async () => {
      render(<SubmissionFilters {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'test search' } });

      expect(searchInput).toHaveValue('test search');

      // Submit the form
      const form = searchInput.closest('form');
      fireEvent.submit(form!);

      await waitFor(() => {
        expect(mockOnFilterChange).toHaveBeenCalledWith({
          search: 'test search',
        });
      });
    });

    it('should clear search when X button is clicked', () => {
      render(<SubmissionFilters {...defaultProps} filters={{ search: 'existing' }} />);

      const searchInput = screen.getByPlaceholderText('Search...');
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const clearButton = screen.getByRole('button', { name: '' });
      fireEvent.click(clearButton);

      expect(searchInput).toHaveValue('');
      expect(mockOnFilterChange).toHaveBeenCalledWith({
        search: undefined,
      });
    });

    it('should show search input with existing search value', () => {
      const props = {
        ...defaultProps,
        filters: { search: 'existing search' },
      };

      render(<SubmissionFilters {...props} />);

      const searchInput = screen.getByPlaceholderText('Search by name, phone, email, territory, rep...');
      expect(searchInput).toHaveValue('existing search');
    });
  });

  describe('Filter Panel Toggle', () => {
    it('should toggle filter panel visibility', () => {
      render(<SubmissionFilters {...defaultProps} />);

      // Initially filter panel should not be visible
      expect(screen.queryByText('Interest Level')).not.toBeInTheDocument();

      clickFiltersButton();

      // Filter panel should now be visible
      expect(screen.getByText('Interest Level')).toBeInTheDocument();
    });

    it('should show "Filters Active" when filters are applied', () => {
      const props = {
        ...defaultProps,
        filters: { signedUp: true },
      };

      render(<SubmissionFilters {...props} />);

      expect(screen.getByText('Filters Active')).toBeInTheDocument();
    });
  });

  describe('Interest Level Filter', () => {
    it('should toggle interest levels correctly', () => {
      render(<SubmissionFilters {...defaultProps} />);

      clickFiltersButton();

      const level3Button = screen.getByText('Level 3');
      fireEvent.click(level3Button);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        interestLevel: [3],
      });
    });

    it('should deselect interest levels correctly', () => {
      const props = {
        ...defaultProps,
        filters: { interestLevel: [3] },
      };

      render(<SubmissionFilters {...props} />);

      clickFiltersButton();

      const level3Button = screen.getByText('Level 3');
      fireEvent.click(level3Button);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        interestLevel: [],
      });
    });

    it('should allow multiple interest levels to be selected', () => {
      const { rerender } = render(<SubmissionFilters {...defaultProps} />);

      clickFiltersButton();

      // Select Level 4
      fireEvent.click(screen.getByText('Level 4'));

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        interestLevel: [4],
      });

      // Update props with Level 4 selected
      rerender(<SubmissionFilters {...defaultProps} filters={{ interestLevel: [4] }} />);

      // Select Level 5
      fireEvent.click(screen.getByText('Level 5'));

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        interestLevel: [4, 5],
      });
    });

    it('should highlight selected interest levels', () => {
      const props = {
        ...defaultProps,
        filters: { interestLevel: [3, 5] },
      };

      render(<SubmissionFilters {...props} />);

      clickFiltersButton();

      const level3Button = screen.getByText('Level 3');
      const level4Button = screen.getByText('Level 4');
      const level5Button = screen.getByText('Level 5');

      // Check selected buttons have correct class
      expect(level3Button).toHaveClass('bg-flash-green');
      expect(level4Button).not.toHaveClass('bg-flash-green');
      expect(level5Button).toHaveClass('bg-flash-green');
    });
  });

  describe('Status Filter', () => {
    it('should toggle between Signed Up and Prospect', () => {
      const { rerender } = render(<SubmissionFilters {...defaultProps} />);

      clickFiltersButton();

      // Click Signed Up
      const signedUpButton = screen.getByText('Signed Up');
      fireEvent.click(signedUpButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        signedUp: true,
      });

      // Update props
      mockOnFilterChange.mockClear();
      rerender(<SubmissionFilters {...defaultProps} filters={{ signedUp: true }} />);

      // Click Prospect
      const prospectButton = screen.getByText('Prospect');
      fireEvent.click(prospectButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        signedUp: false,
      });
    });

    it('should clear status filter when clicking active button', () => {
      const props = {
        ...defaultProps,
        filters: { signedUp: true },
      };

      render(<SubmissionFilters {...props} />);

      clickFiltersButton();

      // Click Signed Up again to clear
      const signedUpButton = screen.getByText('Signed Up');
      fireEvent.click(signedUpButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        signedUp: undefined,
      });
    });
  });

  describe('Package Seen Filter', () => {
    it('should toggle between Yes and No', () => {
      const { rerender } = render(<SubmissionFilters {...defaultProps} />);

      clickFiltersButton();

      // Click Yes
      const yesButton = screen.getByText('Yes');
      fireEvent.click(yesButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        packageSeen: true,
      });

      // Update props
      mockOnFilterChange.mockClear();
      rerender(<SubmissionFilters {...defaultProps} filters={{ packageSeen: true }} />);

      // Click No
      const noButton = screen.getByText('No');
      fireEvent.click(noButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        packageSeen: false,
      });
    });
  });

  describe('Sales Rep Filter', () => {
    it('should update sales rep filter on selection', () => {
      render(<SubmissionFilters {...defaultProps} />);

      clickFiltersButton();

      const repSelect = screen.getByRole('combobox');
      fireEvent.change(repSelect, { target: { value: 'rogimon' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        username: 'rogimon',
      });
    });

    it('should clear sales rep filter when selecting "All Reps"', () => {
      const props = {
        ...defaultProps,
        filters: { username: 'rogimon' },
      };

      render(<SubmissionFilters {...props} />);

      clickFiltersButton();

      const repSelect = screen.getByRole('combobox');
      fireEvent.change(repSelect, { target: { value: '' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        username: undefined,
      });
    });

    it('should handle "Unassigned" selection', () => {
      render(<SubmissionFilters {...defaultProps} />);

      clickFiltersButton();

      const repSelect = screen.getByRole('combobox');
      fireEvent.change(repSelect, { target: { value: 'Unassigned' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        username: 'Unassigned',
      });
    });
  });

  describe('Date Range Filter', () => {
    it('should update start date', () => {
      render(<SubmissionFilters {...defaultProps} />);

      clickFiltersButton();

      // Get date inputs - they are type="date" inputs within the Date Range section
      const dateInputs = screen.getAllByDisplayValue('');
      // Filter to get only date inputs (skip the search input)
      const startDateInput = dateInputs.find(input => input.getAttribute('type') === 'date');
      
      if (startDateInput) {
        fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });

        expect(mockOnFilterChange).toHaveBeenCalledWith({
          dateRange: { start: '2024-01-01' },
        });
      }
    });

    it('should update end date', () => {
      render(<SubmissionFilters {...defaultProps} />);

      clickFiltersButton();

      const dateInputs = screen.getAllByDisplayValue('');
      const dateTypeInputs = dateInputs.filter(input => input.getAttribute('type') === 'date');
      const endDateInput = dateTypeInputs[1]; // Second date input is the end date
      
      if (endDateInput) {
        fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });

        expect(mockOnFilterChange).toHaveBeenCalledWith({
          dateRange: { end: '2024-01-31' },
        });
      }
    });

    it('should preserve existing date when updating the other', () => {
      const props = {
        ...defaultProps,
        filters: { dateRange: { start: '2024-01-01' } },
      };

      render(<SubmissionFilters {...props} />);

      clickFiltersButton();

      // Find end date input (second date input)
      const allInputs = screen.getAllByDisplayValue('');
      const dateInputs = allInputs.filter(input => input.getAttribute('type') === 'date');
      const endDateInput = dateInputs[1];
      
      if (endDateInput) {
        fireEvent.change(endDateInput, { target: { value: '2024-01-31' } });

        expect(mockOnFilterChange).toHaveBeenCalledWith({
          dateRange: { start: '2024-01-01', end: '2024-01-31' },
        });
      }
    });

    it('should clear date when input is emptied', () => {
      const props = {
        ...defaultProps,
        filters: { dateRange: { start: '2024-01-01' } },
      };

      render(<SubmissionFilters {...props} />);

      clickFiltersButton();

      // Find the start date input which should have value '2024-01-01'
      const startDateInput = screen.getByDisplayValue('2024-01-01');
      
      fireEvent.change(startDateInput, { target: { value: '' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        dateRange: {},
      });
    });
  });

  describe('Clear Filters', () => {
    it('should call onResetFilters when Clear button is clicked', () => {
      const props = {
        ...defaultProps,
        filters: { signedUp: true },
      };

      render(<SubmissionFilters {...props} />);

      const clearButton = screen.getByText('Clear');
      fireEvent.click(clearButton);

      expect(mockOnResetFilters).toHaveBeenCalled();
    });

    it('should not show Clear button when no filters are active', () => {
      render(<SubmissionFilters {...defaultProps} />);

      expect(screen.queryByText('Clear')).not.toBeInTheDocument();
    });
  });

  describe('Filter Active State', () => {
    it('should detect active filters correctly', () => {
      const testCases = [
        { filters: { search: 'test' }, shouldBeActive: true },
        { filters: { interestLevel: [3] }, shouldBeActive: true },
        { filters: { signedUp: true }, shouldBeActive: true },
        { filters: { packageSeen: false }, shouldBeActive: true },
        { filters: { dateRange: { start: '2024-01-01' } }, shouldBeActive: true },
        { filters: { username: 'rogimon' }, shouldBeActive: true },
        { filters: {}, shouldBeActive: false },
      ];

      testCases.forEach(({ filters, shouldBeActive }) => {
        const { rerender } = render(
          <SubmissionFilters {...defaultProps} filters={filters} />
        );

        if (shouldBeActive) {
          expect(screen.getByText('Filters Active')).toBeInTheDocument();
          expect(screen.getByText('Clear')).toBeInTheDocument();
        } else {
          expect(screen.queryByText('Filters Active')).not.toBeInTheDocument();
          expect(screen.queryByText('Clear')).not.toBeInTheDocument();
        }

        // Clean up for next iteration
        rerender(<div />);
      });
    });
  });

  describe('Complex Filter Scenarios', () => {
    it('should handle multiple filters being applied simultaneously', () => {
      const { rerender } = render(<SubmissionFilters {...defaultProps} />);

      clickFiltersButton();

      // Apply multiple filters
      fireEvent.click(screen.getByText('Level 4'));
      expect(mockOnFilterChange).toHaveBeenLastCalledWith({
        interestLevel: [4],
      });

      rerender(<SubmissionFilters {...defaultProps} filters={{ interestLevel: [4] }} />);
      
      fireEvent.click(screen.getByText('Signed Up'));
      expect(mockOnFilterChange).toHaveBeenLastCalledWith({
        interestLevel: [4],
        signedUp: true,
      });

      rerender(<SubmissionFilters {...defaultProps} filters={{ interestLevel: [4], signedUp: true }} />);

      const repSelect = screen.getByRole('combobox');
      fireEvent.change(repSelect, { target: { value: 'rogimon' } });
      expect(mockOnFilterChange).toHaveBeenLastCalledWith({
        interestLevel: [4],
        signedUp: true,
        username: 'rogimon',
      });
    });

    it('should preserve all other filters when updating one', () => {
      const initialFilters = {
        search: 'test',
        interestLevel: [3, 4],
        signedUp: true,
        packageSeen: false,
        username: 'rogimon',
      };

      const props = {
        ...defaultProps,
        filters: initialFilters,
      };

      render(<SubmissionFilters {...props} />);

      clickFiltersButton();

      // Change package seen
      fireEvent.click(screen.getByText('Yes'));

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...initialFilters,
        packageSeen: true,
      });
    });
  });
});