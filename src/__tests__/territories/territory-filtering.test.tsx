import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSubmissions } from '@/hooks/useSubmissions';
import * as supabaseApi from '@/lib/supabase-api';
import * as api from '@/lib/api';

// Mock supabase-api
jest.mock('@/lib/supabase-api');
// Mock api.ts to use supabase
jest.mock('@/lib/api');

// Create a wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('Territory Filtering', () => {
  const mockSubmissions = [
    {
      id: '1',
      ownerName: 'Jamaica Business',
      phoneNumber: '+1-876-555-0100',
      packageSeen: true,
      decisionMakers: 'CEO',
      interestLevel: 4,
      signedUp: false,
      username: 'rogimon',
      territory: 'Kingston',
      territoryId: 'kingston-id',
      territoryData: {
        id: 'kingston-id',
        name: 'Kingston',
        type: 'parish',
        countryCode: 'JM',
        countryName: 'Jamaica',
        flagEmoji: '🇯🇲',
        fullPath: 'Jamaica > Kingston'
      },
      timestamp: new Date().toISOString()
    },
    {
      id: '2',
      ownerName: 'Cayman Business',
      phoneNumber: '+1-345-555-0200',
      packageSeen: false,
      decisionMakers: 'Manager',
      interestLevel: 3,
      signedUp: false,
      username: 'tatiana_1',
      territory: 'George Town',
      territoryId: 'george-town-id',
      territoryData: {
        id: 'george-town-id',
        name: 'George Town',
        type: 'district',
        countryCode: 'KY',
        countryName: 'Cayman Islands',
        flagEmoji: '🇰🇾',
        fullPath: 'Cayman Islands > George Town'
      },
      timestamp: new Date().toISOString()
    },
    {
      id: '3',
      ownerName: 'Curaçao Business',
      phoneNumber: '+599-9-555-0300',
      packageSeen: true,
      decisionMakers: 'Owner',
      interestLevel: 5,
      signedUp: true,
      username: 'charms',
      territory: 'Willemstad',
      territoryId: 'willemstad-id',
      territoryData: {
        id: 'willemstad-id',
        name: 'Willemstad',
        type: 'district',
        countryCode: 'CW',
        countryName: 'Curaçao',
        flagEmoji: '🇨🇼',
        fullPath: 'Curaçao > Willemstad'
      },
      timestamp: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Country Filtering', () => {
    it('filters submissions by country code', async () => {
      const mockGetSubmissions = jest.spyOn(api, 'getSubmissions');
      mockGetSubmissions.mockResolvedValue({
        data: [mockSubmissions[0]], // Only Jamaica submission
        totalCount: 1,
        pageCount: 1
      });

      const { result } = renderHook(() => 
        useSubmissions({ countryCode: 'JM' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetSubmissions).toHaveBeenCalledWith(
        expect.objectContaining({ countryCode: 'JM' }),
        expect.any(Object),
        expect.any(Array)
      );

      expect(result.current.submissions).toHaveLength(1);
      expect(result.current.submissions[0].territoryData?.countryCode).toBe('JM');
    });

    it('returns all submissions when no country filter applied', async () => {
      const mockGetSubmissions = jest.spyOn(api, 'getSubmissions');
      mockGetSubmissions.mockResolvedValue({
        data: mockSubmissions,
        totalCount: 3,
        pageCount: 1
      });

      const { result } = renderHook(() => 
        useSubmissions({}),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetSubmissions).toHaveBeenCalledWith(
        expect.not.objectContaining({ countryCode: expect.any(String) }),
        expect.any(Object),
        expect.any(Array)
      );

      expect(result.current.submissions).toHaveLength(3);
    });

    it('filters submissions for Cayman Islands', async () => {
      const mockGetSubmissions = jest.spyOn(api, 'getSubmissions');
      mockGetSubmissions.mockResolvedValue({
        data: [mockSubmissions[1]], // Only Cayman submission
        totalCount: 1,
        pageCount: 1
      });

      const { result } = renderHook(() => 
        useSubmissions({ countryCode: 'KY' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.submissions).toHaveLength(1);
      expect(result.current.submissions[0].territoryData?.countryCode).toBe('KY');
      expect(result.current.submissions[0].territoryData?.countryName).toBe('Cayman Islands');
    });

    it('filters submissions for Curaçao', async () => {
      const mockGetSubmissions = jest.spyOn(api, 'getSubmissions');
      mockGetSubmissions.mockResolvedValue({
        data: [mockSubmissions[2]], // Only Curaçao submission
        totalCount: 1,
        pageCount: 1
      });

      const { result } = renderHook(() => 
        useSubmissions({ countryCode: 'CW' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.submissions).toHaveLength(1);
      expect(result.current.submissions[0].territoryData?.countryCode).toBe('CW');
      expect(result.current.submissions[0].territoryData?.flagEmoji).toBe('🇨🇼');
    });
  });

  describe('Territory Filtering', () => {
    it('filters submissions by territory ID', async () => {
      const mockGetSubmissions = jest.spyOn(api, 'getSubmissions');
      mockGetSubmissions.mockResolvedValue({
        data: [mockSubmissions[0]], // Kingston submission
        totalCount: 1,
        pageCount: 1
      });

      const { result } = renderHook(() => 
        useSubmissions({ territoryId: 'kingston-id' }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetSubmissions).toHaveBeenCalledWith(
        expect.objectContaining({ territoryId: 'kingston-id' }),
        expect.any(Object),
        expect.any(Array)
      );

      expect(result.current.submissions).toHaveLength(1);
      expect(result.current.submissions[0].territoryId).toBe('kingston-id');
    });

    it('combines country and territory filters', async () => {
      const mockGetSubmissions = jest.spyOn(api, 'getSubmissions');
      mockGetSubmissions.mockResolvedValue({
        data: [mockSubmissions[1]],
        totalCount: 1,
        pageCount: 1
      });

      const { result } = renderHook(() => 
        useSubmissions({ 
          countryCode: 'KY',
          territoryId: 'george-town-id'
        }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockGetSubmissions).toHaveBeenCalledWith(
        expect.objectContaining({ 
          countryCode: 'KY',
          territoryId: 'george-town-id'
        }),
        expect.any(Object),
        expect.any(Array)
      );
    });
  });

  describe('Legacy Territory Support', () => {
    it('handles submissions with legacy territory field', async () => {
      const legacySubmission = {
        ...mockSubmissions[0],
        territoryId: undefined,
        territoryData: undefined,
        territory: 'Kingston' // Legacy field
      };

      const mockGetSubmissions = jest.spyOn(api, 'getSubmissions');
      mockGetSubmissions.mockResolvedValue({
        data: [legacySubmission],
        totalCount: 1,
        pageCount: 1
      });

      const { result } = renderHook(() => 
        useSubmissions({}),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.submissions).toHaveLength(1);
      expect(result.current.submissions[0].territory).toBe('Kingston');
      expect(result.current.submissions[0].territoryData).toBeUndefined();
    });

    it('prefers territoryData over legacy territory field', async () => {
      const mixedSubmission = {
        ...mockSubmissions[0],
        territory: 'Old Kingston Name', // Legacy field should be ignored
      };

      const mockGetSubmissions = jest.spyOn(api, 'getSubmissions');
      mockGetSubmissions.mockResolvedValue({
        data: [mixedSubmission],
        totalCount: 1,
        pageCount: 1
      });

      const { result } = renderHook(() => 
        useSubmissions({}),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should use territoryData name, not legacy field
      expect(result.current.submissions[0].territoryData?.name).toBe('Kingston');
      expect(result.current.submissions[0].territory).toBe('Old Kingston Name');
    });
  });
});