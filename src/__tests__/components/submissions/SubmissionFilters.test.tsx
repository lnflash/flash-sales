import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import SubmissionFilters from '@/components/submissions/SubmissionFilters';
import { SubmissionFilters as SubmissionFiltersType } from '@/types/submission';

describe('SubmissionFilters Component', () => {
  const mockOnFilterChange = jest.fn();
  const mockOnResetFilters = jest.fn();

  const defaultProps = {
    filters: {},
    onFilterChange: mockOnFilterChange,
    onResetFilters: mockOnResetFilters,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Search Functionality', () => {
    it('should update search input and trigger filter change on submit', async () => {
      render(<SubmissionFilters {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText('Search by name, phone, email, territory, rep...');
      await userEvent.type(searchInput, 'test search');
      
      expect(searchInput).toHaveValue('test search');

      // Submit the form
      const form = searchInput.closest('form');
      fireEvent.submit(form!);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        search: 'test search',
      });
    });

    it('should clear search when X button is clicked', async () => {
      const props = {
        ...defaultProps,
        filters: { search: 'existing search' },
      };

      render(<SubmissionFilters {...props} />);

      const searchInput = screen.getByPlaceholderText('Search by name, phone, email, territory, rep...');
      expect(searchInput).toHaveValue('existing search');

      // Click clear button
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
        filters: { search: 'Kingston' },
      };

      render(<SubmissionFilters {...props} />);

      const searchInput = screen.getByPlaceholderText('Search by name, phone, email, territory, rep...');
      expect(searchInput).toHaveValue('Kingston');
    });
  });

  describe('Filter Panel Toggle', () => {
    it('should toggle filter panel visibility', () => {
      render(<SubmissionFilters {...defaultProps} />);

      // Filter panel should be hidden initially
      expect(screen.queryByText('Interest Level')).not.toBeInTheDocument();

      // Click to show filters
      const filtersButton = screen.getByText('Filters');
      fireEvent.click(filtersButton);

      // Filter panel should be visible
      expect(screen.getByText('Interest Level')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Package Seen')).toBeInTheDocument();
      expect(screen.getByText('Sales Rep')).toBeInTheDocument();
      expect(screen.getByText('Date Range')).toBeInTheDocument();

      // Click to hide filters
      fireEvent.click(filtersButton);
      expect(screen.queryByText('Interest Level')).not.toBeInTheDocument();
    });

    it('should show "Filters Active" when filters are applied', () => {
      const props = {
        ...defaultProps,
        filters: { interestLevel: [4, 5] },
      };

      render(<SubmissionFilters {...props} />);

      expect(screen.getByText('Filters Active')).toBeInTheDocument();
      expect(screen.getByText('Clear')).toBeInTheDocument();
    });
  });

  describe('Interest Level Filter', () => {
    it('should toggle interest levels correctly', () => {
      render(<SubmissionFilters {...defaultProps} />);

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      // Click Level 3
      const level3Button = screen.getByText('Level 3');
      fireEvent.click(level3Button);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        interestLevel: [3],
      });
    });

    it('should deselect interest levels correctly', () => {
      // Start with Level 3 already selected
      render(<SubmissionFilters {...defaultProps} filters={{ interestLevel: [3] }} />);

      // Show filters
      fireEvent.click(screen.getByText('Filters Active'));

      // Click Level 3 again to deselect
      fireEvent.click(screen.getByText('Level 3'));

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        interestLevel: [],
      });
    });

    it('should allow multiple interest levels to be selected', () => {
      const { rerender } = render(<SubmissionFilters {...defaultProps} />);

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

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

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

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
      render(<SubmissionFilters {...defaultProps} />);

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      // Click Signed Up
      const signedUpButton = screen.getByText('Signed Up');
      fireEvent.click(signedUpButton);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        signedUp: true,
      });

      // Reset and update props
      mockOnFilterChange.mockClear();
      const { rerender } = render(
        <SubmissionFilters {...defaultProps} filters={{ signedUp: true }} />
      );

      fireEvent.click(screen.getByText('Filters'));

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

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

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
      render(<SubmissionFilters {...defaultProps} />);

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      // Find the Package Seen section and its buttons
      const packageSeenLabel = screen.getByText('Package Seen');
      const packageSeenSection = packageSeenLabel.closest('div');
      const yesButton = packageSeenSection?.querySelector('button:nth-of-type(1)');
      const noButton = packageSeenSection?.querySelector('button:nth-of-type(2)');

      // Click Yes
      fireEvent.click(yesButton!);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        packageSeen: true,
      });

      // Reset and update props
      mockOnFilterChange.mockClear();
      const { rerender } = render(
        <SubmissionFilters {...defaultProps} filters={{ packageSeen: true }} />
      );

      fireEvent.click(screen.getByText('Filters'));

      // Click No
      const updatedPackageSeenSection = screen.getByText('Package Seen').closest('div');
      const updatedNoButton = updatedPackageSeenSection?.querySelector('button:nth-of-type(2)');
      fireEvent.click(updatedNoButton!);

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        packageSeen: false,
      });
    });
  });

  describe('Sales Rep Filter', () => {
    it('should update sales rep filter on selection', () => {
      render(<SubmissionFilters {...defaultProps} />);

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      const salesRepSelect = screen.getByLabelText('Sales Rep');
      fireEvent.change(salesRepSelect, { target: { value: 'rogimon' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        username: 'rogimon',
      });
    });

    it('should clear sales rep filter when selecting "All Reps"', () => {
      const props = {
        ...defaultProps,
        filters: { username: 'charms' },
      };

      render(<SubmissionFilters {...props} />);

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      const salesRepSelect = screen.getByLabelText('Sales Rep');
      expect(salesRepSelect).toHaveValue('charms');

      fireEvent.change(salesRepSelect, { target: { value: '' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        username: undefined,
      });
    });

    it('should handle "Unassigned" selection', () => {
      render(<SubmissionFilters {...defaultProps} />);

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      const salesRepSelect = screen.getByLabelText('Sales Rep');
      fireEvent.change(salesRepSelect, { target: { value: 'Unassigned' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        username: 'Unassigned',
      });
    });
  });

  describe('Date Range Filter', () => {
    it('should update start date', () => {
      render(<SubmissionFilters {...defaultProps} />);

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      const fromDateInput = screen.getByLabelText('From');
      fireEvent.change(fromDateInput, { target: { value: '2024-01-01' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        dateRange: {
          start: '2024-01-01',
        },
      });
    });

    it('should update end date', () => {
      render(<SubmissionFilters {...defaultProps} />);

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      const toDateInput = screen.getByLabelText('To');
      fireEvent.change(toDateInput, { target: { value: '2024-01-31' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        dateRange: {
          end: '2024-01-31',
        },
      });
    });

    it('should preserve existing date when updating the other', () => {
      const props = {
        ...defaultProps,
        filters: {
          dateRange: {
            start: '2024-01-01',
          },
        },
      };

      render(<SubmissionFilters {...props} />);

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      const toDateInput = screen.getByLabelText('To');
      fireEvent.change(toDateInput, { target: { value: '2024-01-31' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-31',
        },
      });
    });

    it('should clear date when input is emptied', () => {
      const props = {
        ...defaultProps,
        filters: {
          dateRange: {
            start: '2024-01-01',
            end: '2024-01-31',
          },
        },
      };

      render(<SubmissionFilters {...props} />);

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      const fromDateInput = screen.getByLabelText('From');
      fireEvent.change(fromDateInput, { target: { value: '' } });

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        dateRange: {
          start: undefined,
          end: '2024-01-31',
        },
      });
    });
  });

  describe('Clear Filters', () => {
    it('should call onResetFilters when Clear button is clicked', () => {
      const props = {
        ...defaultProps,
        filters: {
          search: 'test',
          interestLevel: [4, 5],
          signedUp: true,
          packageSeen: false,
          username: 'rogimon',
          dateRange: {
            start: '2024-01-01',
            end: '2024-01-31',
          },
        },
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
        { filters: { interestLevel: [1] }, shouldBeActive: true },
        { filters: { signedUp: true }, shouldBeActive: true },
        { filters: { signedUp: false }, shouldBeActive: true },
        { filters: { packageSeen: true }, shouldBeActive: true },
        { filters: { packageSeen: false }, shouldBeActive: true },
        { filters: { username: 'rogimon' }, shouldBeActive: true },
        { filters: { dateRange: { start: '2024-01-01' } }, shouldBeActive: true },
        { filters: { dateRange: { end: '2024-01-31' } }, shouldBeActive: true },
        { filters: {}, shouldBeActive: false },
        { filters: { interestLevel: [] }, shouldBeActive: false },
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

        rerender(<></>); // Clean up between test cases
      });
    });
  });

  describe('Complex Filter Scenarios', () => {
    it('should handle multiple filters being applied simultaneously', () => {
      const { rerender } = render(<SubmissionFilters {...defaultProps} />);

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      // Apply multiple filters in sequence
      // 1. Interest Level
      fireEvent.click(screen.getByText('Level 4'));
      expect(mockOnFilterChange).toHaveBeenLastCalledWith({
        interestLevel: [4],
      });

      // Update props
      rerender(<SubmissionFilters {...defaultProps} filters={{ interestLevel: [4] }} />);

      // 2. Status
      fireEvent.click(screen.getByText('Signed Up'));
      expect(mockOnFilterChange).toHaveBeenLastCalledWith({
        interestLevel: [4],
        signedUp: true,
      });

      // Update props
      rerender(<SubmissionFilters {...defaultProps} filters={{ interestLevel: [4], signedUp: true }} />);

      // 3. Sales Rep
      const salesRepSelect = screen.getByLabelText('Sales Rep');
      fireEvent.change(salesRepSelect, { target: { value: 'charms' } });
      expect(mockOnFilterChange).toHaveBeenLastCalledWith({
        interestLevel: [4],
        signedUp: true,
        username: 'charms',
      });
    });

    it('should preserve all other filters when updating one', () => {
      const existingFilters: SubmissionFiltersType = {
        search: 'Kingston',
        interestLevel: [3, 4, 5],
        signedUp: true,
        packageSeen: false,
        username: 'rogimon',
        dateRange: {
          start: '2024-01-01',
          end: '2024-01-31',
        },
      };

      render(<SubmissionFilters {...defaultProps} filters={existingFilters} />);

      // Show filters
      fireEvent.click(screen.getByText('Filters'));

      // Change one filter
      fireEvent.click(screen.getByText('Level 2'));

      expect(mockOnFilterChange).toHaveBeenCalledWith({
        ...existingFilters,
        interestLevel: [3, 4, 5, 2],
      });
    });
  });
});