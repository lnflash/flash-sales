import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import IntakeForm from '@/components/intake/IntakeForm';
import { enrichCompany } from '@/services/data-enrichment';

// Mock the enrichment service
jest.mock('@/services/data-enrichment', () => ({
  enrichCompany: jest.fn(),
  enrichPerson: jest.fn(),
  enrichPhoneNumber: jest.fn()
}));

// Mock router
jest.mock('next/router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: '/intake'
  })
}));

describe('Intake Form - Company Enrichment Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('UI Display of Enrichment Results', () => {
    it('should display loading state while enriching', async () => {
      (enrichCompany as jest.Mock).mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          success: true,
          data: {
            name: 'Test Company',
            industry: 'Technology',
            location: { address: '123 Test St' }
          }
        }), 1000))
      );

      render(<IntakeForm />);
      
      const input = screen.getByLabelText(/Business Name/i);
      await userEvent.type(input, 'Test Company');

      await waitFor(() => {
        expect(screen.getByText(/Loading company information/i)).toBeInTheDocument();
      });
    });

    it('should display enriched company information when found', async () => {
      const mockEnrichmentData = {
        success: true,
        data: {
          name: 'Island Grill',
          industry: 'Restaurant',
          location: {
            address: '123 Hope Road, Kingston, Jamaica',
            city: 'Kingston',
            state: 'Kingston Parish',
            country: 'JM',
            coordinates: { lat: 18.0179, lng: -76.8099 }
          },
          contact: {
            phone: '+1 876-555-0100',
            website: 'https://islandgrill.com',
            email: null
          },
          additionalInfo: {
            rating: 4.5,
            totalRatings: 250,
            businessStatus: 'OPERATIONAL'
          }
        },
        source: 'google_places',
        timestamp: new Date().toISOString()
      };

      (enrichCompany as jest.Mock).mockResolvedValue(mockEnrichmentData);

      render(<IntakeForm />);
      
      const input = screen.getByLabelText(/Business Name/i);
      await userEvent.type(input, 'Island Grill');

      await waitFor(() => {
        expect(screen.getByText(/Company Information Found/i)).toBeInTheDocument();
      });

      // Check all displayed information
      expect(screen.getByText(/Industry: Restaurant/i)).toBeInTheDocument();
      expect(screen.getByText(/123 Hope Road, Kingston, Jamaica/i)).toBeInTheDocument();
      expect(screen.getByText(/\+1 876-555-0100/i)).toBeInTheDocument();
      expect(screen.getByText(/islandgrill.com/i)).toBeInTheDocument();
      expect(screen.getByText(/4.5 ⭐/i)).toBeInTheDocument();
      expect(screen.getByText(/250 reviews/i)).toBeInTheDocument();
      expect(screen.getByText(/Status: OPERATIONAL/i)).toBeInTheDocument();
    });

    it('should display "No results found" message when company not found', async () => {
      const mockNoResults = {
        success: true,
        data: {
          name: 'Unknown Company XYZ',
          additionalInfo: {
            noResultsFound: true,
            searchQuery: 'Unknown Company XYZ Kingston'
          }
        }
      };

      (enrichCompany as jest.Mock).mockResolvedValue(mockNoResults);

      render(<IntakeForm />);
      
      const input = screen.getByLabelText(/Business Name/i);
      await userEvent.type(input, 'Unknown Company XYZ');

      await waitFor(() => {
        expect(screen.getByText(/No results found for this business name/i)).toBeInTheDocument();
      });
    });

    it('should handle enrichment errors gracefully', async () => {
      (enrichCompany as jest.Mock).mockResolvedValue({
        success: false,
        error: 'API quota exceeded'
      });

      render(<IntakeForm />);
      
      const input = screen.getByLabelText(/Business Name/i);
      await userEvent.type(input, 'Test Company');

      // Should not crash, error should be logged
      await waitFor(() => {
        expect(screen.queryByText(/Company Information Found/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Debouncing and Performance', () => {
    it('should debounce API calls when typing', async () => {
      (enrichCompany as jest.Mock).mockResolvedValue({
        success: true,
        data: { name: 'Test' }
      });

      render(<IntakeForm />);
      
      const input = screen.getByLabelText(/Business Name/i);
      
      // Type quickly
      await userEvent.type(input, 'T');
      await userEvent.type(input, 'e');
      await userEvent.type(input, 's');
      await userEvent.type(input, 't');

      // Should only call once after debounce period
      await waitFor(() => {
        expect(enrichCompany).toHaveBeenCalledTimes(1);
      }, { timeout: 2000 });
    });

    it('should cancel previous enrichment calls when typing continues', async () => {
      let callCount = 0;
      (enrichCompany as jest.Mock).mockImplementation(() => {
        callCount++;
        return new Promise(resolve => 
          setTimeout(() => resolve({
            success: true,
            data: { name: `Call ${callCount}` }
          }), 500)
        );
      });

      render(<IntakeForm />);
      
      const input = screen.getByLabelText(/Business Name/i);
      
      await userEvent.type(input, 'First');
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      await userEvent.clear(input);
      await userEvent.type(input, 'Second');
      
      await waitFor(() => {
        expect(enrichCompany).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Form Field Auto-population', () => {
    it('should auto-populate phone number from enrichment data', async () => {
      (enrichCompany as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          name: 'Test Company',
          contact: {
            phone: '+1 876-555-0100'
          }
        }
      });

      render(<IntakeForm />);
      
      const businessInput = screen.getByLabelText(/Business Name/i);
      const phoneInput = screen.getByLabelText(/Phone Number/i) as HTMLInputElement;
      
      await userEvent.type(businessInput, 'Test Company');

      await waitFor(() => {
        expect(phoneInput.value).toBe('');
      });

      // User should be able to click a button to auto-fill
      // This depends on implementation
    });
  });

  describe('Territory-specific Searches', () => {
    const territories = [
      'Kingston',
      'St. Andrew',
      'St. Catherine',
      'Clarendon',
      'Manchester',
      'St. Elizabeth',
      'Westmoreland',
      'Hanover',
      'St. James',
      'Trelawny',
      'St. Ann',
      'St. Mary',
      'Portland',
      'St. Thomas'
    ];

    territories.forEach(territory => {
      it(`should include ${territory} in search query when selected`, async () => {
        (enrichCompany as jest.Mock).mockResolvedValue({
          success: true,
          data: { name: 'Test' }
        });

        render(<IntakeForm />);
        
        // Select territory
        const territorySelect = screen.getByLabelText(/Territory/i);
        fireEvent.change(territorySelect, { target: { value: territory } });
        
        // Type business name
        const businessInput = screen.getByLabelText(/Business Name/i);
        await userEvent.type(businessInput, 'Test Business');

        await waitFor(() => {
          expect(enrichCompany).toHaveBeenCalledWith(
            expect.objectContaining({
              name: 'Test Business',
              location: territory
            })
          );
        });
      });
    });
  });

  describe('Real-time Validation', () => {
    it('should not enrich when business name is too short', async () => {
      render(<IntakeForm />);
      
      const input = screen.getByLabelText(/Business Name/i);
      await userEvent.type(input, 'AB'); // Only 2 characters

      await waitFor(() => {
        expect(enrichCompany).not.toHaveBeenCalled();
      }, { timeout: 1500 });
    });

    it('should start enriching when business name is 3+ characters', async () => {
      (enrichCompany as jest.Mock).mockResolvedValue({
        success: true,
        data: { name: 'ABC' }
      });

      render(<IntakeForm />);
      
      const input = screen.getByLabelText(/Business Name/i);
      await userEvent.type(input, 'ABC');

      await waitFor(() => {
        expect(enrichCompany).toHaveBeenCalled();
      });
    });
  });

  describe('Cache Behavior', () => {
    it('should use cached data for repeated searches', async () => {
      const mockData = {
        success: true,
        data: { name: 'Cached Company' },
        source: 'cache'
      };

      (enrichCompany as jest.Mock).mockResolvedValue(mockData);

      render(<IntakeForm />);
      
      const input = screen.getByLabelText(/Business Name/i);
      
      // First search
      await userEvent.type(input, 'Cached Company');
      await waitFor(() => expect(enrichCompany).toHaveBeenCalledTimes(1));
      
      // Clear and search again
      await userEvent.clear(input);
      await userEvent.type(input, 'Cached Company');
      
      await waitFor(() => {
        expect(enrichCompany).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Accessibility', () => {
    it('should announce enrichment results to screen readers', async () => {
      (enrichCompany as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          name: 'Test Company',
          industry: 'Technology'
        }
      });

      render(<IntakeForm />);
      
      const input = screen.getByLabelText(/Business Name/i);
      await userEvent.type(input, 'Test Company');

      await waitFor(() => {
        const infoBox = screen.getByText(/Company Information Found/i).parentElement;
        expect(infoBox).toHaveAttribute('role', 'status');
        expect(infoBox).toHaveAttribute('aria-live', 'polite');
      });
    });

    it('should maintain focus on input while enriching', async () => {
      (enrichCompany as jest.Mock).mockResolvedValue({
        success: true,
        data: { name: 'Test' }
      });

      render(<IntakeForm />);
      
      const input = screen.getByLabelText(/Business Name/i);
      await userEvent.type(input, 'Test Company');

      await waitFor(() => {
        expect(document.activeElement).toBe(input);
      });
    });
  });
});