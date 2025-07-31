import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LeadStatus } from '@/types/submission';

// Test component that mimics the lead status dropdown functionality
function LeadStatusForm() {
  const [formData, setFormData] = React.useState({
    leadStatus: '' as LeadStatus | '',
    signedUp: false
  });

  const handleLeadStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value as LeadStatus;
    const isSignedUp = value === 'signed_up';
    setFormData({
      leadStatus: value,
      signedUp: isSignedUp
    });
  };

  return (
    <form>
      <select
        id="leadStatus"
        name="leadStatus"
        value={formData.leadStatus}
        onChange={handleLeadStatusChange}
        data-testid="lead-status-select"
      >
        <option value="">Select Status</option>
        <option value="canvas">Canvas</option>
        <option value="contacted">Contacted</option>
        <option value="prospect">Prospect</option>
        <option value="opportunity">Opportunity</option>
        <option value="signed_up">Signed Up</option>
      </select>
      <div data-testid="signed-up-value">{formData.signedUp.toString()}</div>
    </form>
  );
}

describe('Lead Status Form', () => {
  it('should render all lead status options', () => {
    render(<LeadStatusForm />);
    
    const select = screen.getByTestId('lead-status-select');
    expect(select).toBeInTheDocument();
    
    // Check all options are present
    expect(screen.getByText('Select Status')).toBeInTheDocument();
    expect(screen.getByText('Canvas')).toBeInTheDocument();
    expect(screen.getByText('Contacted')).toBeInTheDocument();
    expect(screen.getByText('Prospect')).toBeInTheDocument();
    expect(screen.getByText('Opportunity')).toBeInTheDocument();
    expect(screen.getByText('Signed Up')).toBeInTheDocument();
  });

  it('should update lead status when selection changes', async () => {
    const user = userEvent.setup();
    render(<LeadStatusForm />);
    
    const select = screen.getByTestId('lead-status-select');
    
    await user.selectOptions(select, 'prospect');
    
    expect((screen.getByRole('option', { name: 'Prospect' }) as HTMLOptionElement).selected).toBe(true);
  });

  it('should sync signedUp to true when lead status is signed_up', async () => {
    const user = userEvent.setup();
    render(<LeadStatusForm />);
    
    const select = screen.getByTestId('lead-status-select');
    const signedUpDisplay = screen.getByTestId('signed-up-value');
    
    // Initially signedUp should be false
    expect(signedUpDisplay).toHaveTextContent('false');
    
    // Select signed_up status
    await user.selectOptions(select, 'signed_up');
    
    // signedUp should now be true
    expect(signedUpDisplay).toHaveTextContent('true');
  });

  it('should keep signedUp as false for non-signed_up statuses', async () => {
    const user = userEvent.setup();
    render(<LeadStatusForm />);
    
    const select = screen.getByTestId('lead-status-select');
    const signedUpDisplay = screen.getByTestId('signed-up-value');
    
    // Test various non-signed_up statuses
    const statuses = ['canvas', 'contacted', 'prospect', 'opportunity'];
    
    for (const status of statuses) {
      await user.selectOptions(select, status);
      expect(signedUpDisplay).toHaveTextContent('false');
    }
  });

  it('should handle empty selection', async () => {
    const user = userEvent.setup();
    render(<LeadStatusForm />);
    
    const select = screen.getByTestId('lead-status-select');
    
    // Select a status first
    await user.selectOptions(select, 'prospect');
    
    // Then select empty option
    await user.selectOptions(select, '');
    
    expect((screen.getByRole('option', { name: 'Select Status' }) as HTMLOptionElement).selected).toBe(true);
  });
});

describe('Lead Status Display', () => {
  it('should format lead status for display', () => {
    const formatLeadStatus = (status: LeadStatus): string => {
      return status.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
      ).join(' ');
    };

    expect(formatLeadStatus('canvas')).toBe('Canvas');
    expect(formatLeadStatus('contacted')).toBe('Contacted');
    expect(formatLeadStatus('prospect')).toBe('Prospect');
    expect(formatLeadStatus('opportunity')).toBe('Opportunity');
    expect(formatLeadStatus('signed_up')).toBe('Signed Up');
  });

  it('should apply correct styling based on lead status', () => {
    const getStatusClasses = (status: LeadStatus): string => {
      switch (status) {
        case 'signed_up':
          return 'bg-flash-green/10 text-flash-green border border-flash-green/20';
        case 'opportunity':
          return 'bg-purple-100 text-purple-800 border border-purple-300';
        case 'prospect':
          return 'bg-blue-100 text-blue-800 border border-blue-300';
        case 'contacted':
          return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
        case 'canvas':
        default:
          return 'bg-gray-100 text-light-text-secondary border border-light-border';
      }
    };

    expect(getStatusClasses('signed_up')).toContain('flash-green');
    expect(getStatusClasses('opportunity')).toContain('purple');
    expect(getStatusClasses('prospect')).toContain('blue');
    expect(getStatusClasses('contacted')).toContain('yellow');
    expect(getStatusClasses('canvas')).toContain('gray');
  });
});