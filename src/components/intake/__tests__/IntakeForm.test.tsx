import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/router';
import IntakeForm from '../IntakeForm';
import { createSubmission, updateSubmission, getSubmissionById } from '@/lib/api';
import { getUserFromStorage } from '@/lib/auth';

// Mock dependencies
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  createSubmission: jest.fn(),
  updateSubmission: jest.fn(),
  getSubmissionById: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  getUserFromStorage: jest.fn(),
}));

jest.mock('@/contexts/MobileMenuContext', () => ({
  useMobileMenu: () => ({ isMobile: false }),
}));

jest.mock('@/services/data-enrichment', () => ({
  enrichCompany: jest.fn(),
  enrichPerson: jest.fn(),
  enrichPhoneNumber: jest.fn(),
}));

jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null }),
        }),
      }),
    }),
  },
}));

// Mock SubmissionSearch component
jest.mock('../SubmissionSearch', () => {
  return function MockSubmissionSearch({ onSelect, onClear }: any) {
    return (
      <div data-testid="submission-search">
        <button onClick={() => onSelect({ id: '123', ownerName: 'Test Business' })}>
          Select Submission
        </button>
        <button onClick={onClear}>Clear</button>
      </div>
    );
  };
});

describe('IntakeForm', () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      query: {},
    });
    (getUserFromStorage as jest.Mock).mockReturnValue({
      username: 'testuser',
      email: 'testuser@example.com',
    });
    localStorage.clear();
  });

  it('should render the form with all fields', () => {
    render(<IntakeForm />);

    expect(screen.getByText('Flash Sales Canvas Form')).toBeInTheDocument();
    expect(screen.getByLabelText(/Business Name and Owner/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Phone Number/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Have they seen our package/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Decision Makers/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Interest Level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Lead Status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Customer Signed Up/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Specific Needs/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Territory/i)).toBeInTheDocument();
  });

  it('should populate username and territory from user data', () => {
    localStorage.setItem('defaultTerritory_testuser', 'Kingston');
    render(<IntakeForm />);

    const territorySelect = screen.getByLabelText(/Territory/i) as HTMLSelectElement;
    expect(territorySelect.value).toBe('Kingston');
    expect(screen.getByText('testuser')).toBeInTheDocument();
  });

  it('should submit form successfully for new submission', async () => {
    (createSubmission as jest.Mock).mockResolvedValue({
      id: '123',
      ownerName: 'Test Business',
      phoneNumber: '876-555-1234',
    });

    render(<IntakeForm />);

    // Fill in the form
    await userEvent.type(screen.getByLabelText(/Business Name and Owner/i), 'Test Business');
    await userEvent.type(screen.getByLabelText(/Phone Number/i), '876-555-1234');
    await userEvent.click(screen.getByLabelText(/Have they seen our package/i));
    await userEvent.type(screen.getByLabelText(/Decision Makers/i), 'John Doe');
    await userEvent.selectOptions(screen.getByLabelText(/Interest Level/i), '4');
    await userEvent.selectOptions(screen.getByLabelText(/Lead Status/i), 'warm');
    await userEvent.type(screen.getByLabelText(/Specific Needs/i), 'Need payment solution');
    await userEvent.selectOptions(screen.getByLabelText(/Territory/i), 'Kingston');

    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /Submit/i }));

    await waitFor(() => {
      expect(createSubmission).toHaveBeenCalledWith({
        ownerName: 'Test Business',
        phoneNumber: '876-555-1234',
        packageSeen: true,
        decisionMakers: 'John Doe',
        interestLevel: 4,
        signedUp: false,
        leadStatus: 'warm',
        specificNeeds: 'Need payment solution',
        username: 'testuser',
        territory: 'Kingston',
      });
    });

    expect(screen.getByText(/Success!/i)).toBeInTheDocument();
    expect(screen.getByText(/Form submitted successfully!/i)).toBeInTheDocument();
  });

  it('should handle submission errors gracefully', async () => {
    const errorMessage = 'Failed to submit form';
    (createSubmission as jest.Mock).mockRejectedValue(new Error(errorMessage));

    render(<IntakeForm />);

    // Fill in required fields
    await userEvent.type(screen.getByLabelText(/Business Name and Owner/i), 'Test Business');
    await userEvent.type(screen.getByLabelText(/Phone Number/i), '876-555-1234');

    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /Submit/i }));

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
      expect(screen.getByText(/Failed to submit form. Please try again./i)).toBeInTheDocument();
    });
  });

  it('should update existing submission in edit mode', async () => {
    const existingSubmission = {
      id: '123',
      ownerName: 'Existing Business',
      phoneNumber: '876-555-1111',
      packageSeen: true,
      decisionMakers: 'Jane Doe',
      interestLevel: 3,
      signedUp: false,
      leadStatus: 'cold',
      specificNeeds: 'Existing needs',
      username: 'testuser',
      territory: 'St. Andrew',
    };

    (getSubmissionById as jest.Mock).mockResolvedValue(existingSubmission);
    (updateSubmission as jest.Mock).mockResolvedValue({
      ...existingSubmission,
      ownerName: 'Updated Business',
    });

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      query: { id: '123', mode: 'edit' },
    });

    render(<IntakeForm submissionId="123" />);

    await waitFor(() => {
      expect(screen.getByText('Edit Submission')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Existing Business')).toBeInTheDocument();
    });

    // Update the business name
    const businessNameInput = screen.getByLabelText(/Business Name and Owner/i);
    await userEvent.clear(businessNameInput);
    await userEvent.type(businessNameInput, 'Updated Business');

    // Submit the form
    await userEvent.click(screen.getByRole('button', { name: /Update Submission/i }));

    await waitFor(() => {
      expect(updateSubmission).toHaveBeenCalledWith('123', expect.objectContaining({
        ownerName: 'Updated Business',
      }));
    });

    expect(screen.getByText(/Success!/i)).toBeInTheDocument();
    expect(screen.getByText(/Submission updated successfully. Redirecting.../i)).toBeInTheDocument();
    
    // Check redirect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/dashboard/submissions/123');
    }, { timeout: 2000 });
  });

  it('should handle phone number validation', async () => {
    render(<IntakeForm />);

    const phoneInput = screen.getByLabelText(/Phone Number/i);
    
    // Type invalid phone number
    await userEvent.type(phoneInput, '123');

    // The validation should show an error message
    await waitFor(() => {
      expect(screen.getByText(/Invalid format/i)).toBeInTheDocument();
    });

    // Clear and type valid phone number
    await userEvent.clear(phoneInput);
    await userEvent.type(phoneInput, '8765551234');

    // The validation should pass and format the number
    await waitFor(() => {
      expect(screen.getByText(/\+1 \(876\) 555-1234/i)).toBeInTheDocument();
    });
  });

  it('should sync lead status with signed up checkbox', async () => {
    render(<IntakeForm />);

    const leadStatusSelect = screen.getByLabelText(/Lead Status/i) as HTMLSelectElement;
    const signedUpCheckbox = screen.getByLabelText(/Customer Signed Up/i);

    // Select signed_up in lead status
    await userEvent.selectOptions(leadStatusSelect, 'signed_up');

    // The signed up checkbox should be checked
    await waitFor(() => {
      expect(signedUpCheckbox).toBeChecked();
    });

    // Uncheck signed up checkbox
    await userEvent.click(signedUpCheckbox);

    // Lead status should no longer be signed_up
    await waitFor(() => {
      expect(leadStatusSelect.value).not.toBe('signed_up');
    });
  });

  it('should handle submission search and selection', async () => {
    render(<IntakeForm />);

    // The search section should be visible
    expect(screen.getByTestId('submission-search')).toBeInTheDocument();

    // Click select submission
    await userEvent.click(screen.getByText('Select Submission'));

    // Should navigate to edit mode
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/intake?id=123&mode=edit');
    });
  });

  it('should clear form when clear search is clicked', async () => {
    render(<IntakeForm />);

    // Fill in some data
    await userEvent.type(screen.getByLabelText(/Business Name and Owner/i), 'Test Business');
    
    // Click clear
    await userEvent.click(screen.getByText('Clear'));

    // Form should be reset
    await waitFor(() => {
      expect(screen.getByLabelText(/Business Name and Owner/i)).toHaveValue('');
    });

    // Should navigate back to clean URL
    expect(mockPush).toHaveBeenCalledWith('/intake');
  });
});