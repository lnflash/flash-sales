import { createSubmission, updateSubmission, getSubmissionById, mapDealToSubmission } from '../supabase-api';
import { supabase } from '@/lib/supabase/client';

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

describe('supabase-api', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('mapDealToSubmission', () => {
    it('should map deal to submission format', () => {
      const deal = {
        id: '123',
        name: 'Test Business',
        organization: {
          name: 'Test Organization',
          state_province: 'Kingston',
        },
        primary_contact: {
          phone_primary: '876-555-1234',
        },
        owner: {
          username: 'testuser',
          email: 'testuser@getflash.io',
        },
        package_seen: true,
        decision_makers: 'John Doe',
        interest_level: 4,
        status: 'open',
        specific_needs: 'Need payment solution',
        created_at: '2024-01-01T00:00:00Z',
      };

      const submission = mapDealToSubmission(deal);

      expect(submission).toEqual({
        id: '123',
        ownerName: 'Test Organization',
        phoneNumber: '876-555-1234',
        email: '',
        packageSeen: true,
        decisionMakers: 'John Doe',
        interestLevel: 4,
        signedUp: false,
        leadStatus: undefined,
        specificNeeds: 'Need payment solution',
        username: 'testuser',
        territory: 'Kingston',
        timestamp: '2024-01-01T00:00:00Z',
        businessType: '',
        monthlyRevenue: '',
        numberOfEmployees: '',
        yearEstablished: '',
        currentProcessor: '',
        monthlyTransactions: '',
        averageTicketSize: '',
        painPoints: [],
      });
    });

    it('should handle missing data gracefully', () => {
      const deal = {
        id: '123',
        name: 'Test Business',
        created_at: '2024-01-01T00:00:00Z',
      };

      const submission = mapDealToSubmission(deal);

      expect(submission).toEqual({
        id: '123',
        ownerName: 'Test Business',
        phoneNumber: '',
        email: '',
        packageSeen: false,
        decisionMakers: '',
        interestLevel: 3,
        signedUp: false,
        leadStatus: undefined,
        specificNeeds: '',
        username: 'Unassigned',
        territory: '',
        timestamp: '2024-01-01T00:00:00Z',
        businessType: '',
        monthlyRevenue: '',
        numberOfEmployees: '',
        yearEstablished: '',
        currentProcessor: '',
        monthlyTransactions: '',
        averageTicketSize: '',
        painPoints: [],
      });
    });

    it('should map won status to signed_up lead status', () => {
      const deal = {
        id: '123',
        name: 'Test Business',
        status: 'won',
        created_at: '2024-01-01T00:00:00Z',
      };

      const submission = mapDealToSubmission(deal);

      expect(submission.signedUp).toBe(true);
      expect(submission.leadStatus).toBe('converted');
    });
  });

  describe('createSubmission', () => {
    it('should create a new submission successfully', async () => {
      const mockData = {
        ownerName: 'Test Business',
        phoneNumber: '876-555-1234',
        packageSeen: true,
        decisionMakers: 'John Doe',
        interestLevel: 4,
        signedUp: false,
        specificNeeds: 'Need payment solution',
        username: 'testuser',
        territory: 'Kingston',
      };

      const mockOrganization = { id: 'org-123' };
      const mockContact = { id: 'contact-123' };
      const mockUser = { id: 'user-123' };
      const mockDeal = {
        id: 'deal-123',
        ...mockData,
        organization: { name: mockData.ownerName, state_province: mockData.territory },
        primary_contact: { phone_primary: mockData.phoneNumber },
        owner: { username: mockData.username },
      };

      // Mock organization lookup
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null }),
        }),
      });

      // Mock organization creation
      const insertOrgMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockOrganization }),
        }),
      });

      // Mock contact creation
      const insertContactMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockContact }),
        }),
      });

      // Mock user lookup
      const userSelectMock = jest.fn().mockReturnValue({
        or: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockUser }),
        }),
      });

      // Mock deal creation
      const insertDealMock = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockDeal }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'organizations') {
          return {
            select: selectMock,
            insert: insertOrgMock,
          };
        } else if (table === 'contacts') {
          return {
            insert: insertContactMock,
          };
        } else if (table === 'users') {
          return {
            select: userSelectMock,
          };
        } else if (table === 'deals') {
          return {
            insert: insertDealMock,
          };
        }
      });

      const result = await createSubmission(mockData);

      expect(result).toBeDefined();
      expect(result.ownerName).toBe(mockData.ownerName);
      expect(result.phoneNumber).toBe(mockData.phoneNumber);
    });

    it('should handle errors gracefully', async () => {
      const mockData = {
        ownerName: 'Test Business',
        phoneNumber: '876-555-1234',
        packageSeen: true,
        decisionMakers: 'John Doe',
        interestLevel: 4,
        signedUp: false,
        specificNeeds: 'Need payment solution',
        username: 'testuser',
        territory: 'Kingston',
      };

      const errorMessage = 'Database error';

      (supabase.from as jest.Mock).mockImplementation(() => {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockRejectedValue(new Error(errorMessage)),
            }),
          }),
        };
      });

      await expect(createSubmission(mockData)).rejects.toThrow(errorMessage);
    });
  });

  describe('updateSubmission', () => {
    it('should update an existing submission successfully', async () => {
      const submissionId = 'deal-123';
      const updateData = {
        ownerName: 'Updated Business',
        phoneNumber: '876-555-5678',
        interestLevel: 5,
      };

      const currentDeal = {
        organization_id: 'org-123',
        primary_contact_id: 'contact-123',
        owner_id: 'user-123',
      };

      const updatedDeal = {
        id: submissionId,
        name: updateData.ownerName,
        organization: { name: updateData.ownerName },
        primary_contact: { phone_primary: updateData.phoneNumber },
        owner: { username: 'testuser' },
        interest_level: updateData.interestLevel,
      };

      // Mock getting current deal
      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: currentDeal }),
        }),
      });

      // Mock organization update
      const updateOrgMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      // Mock contact update
      const updateContactMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      });

      // Mock deal update
      const updateDealMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: updatedDeal }),
          }),
        }),
      });

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'deals') {
          return {
            select: selectMock,
            update: updateDealMock,
          };
        } else if (table === 'organizations') {
          return {
            update: updateOrgMock,
          };
        } else if (table === 'contacts') {
          return {
            update: updateContactMock,
          };
        }
      });

      const result = await updateSubmission(submissionId, updateData);

      expect(result).toBeDefined();
      expect(result.ownerName).toBe(updateData.ownerName);
      expect(result.phoneNumber).toBe(updateData.phoneNumber);
      expect(result.interestLevel).toBe(updateData.interestLevel);
    });
  });

  describe('getSubmissionById', () => {
    it('should fetch a submission by ID successfully', async () => {
      const submissionId = 'deal-123';
      const mockDeal = {
        id: submissionId,
        name: 'Test Business',
        organization: { name: 'Test Organization' },
        primary_contact: { phone_primary: '876-555-1234' },
        owner: { username: 'testuser' },
        package_seen: true,
        interest_level: 4,
        status: 'open',
      };

      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockDeal }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      const result = await getSubmissionById(submissionId);

      expect(result).toBeDefined();
      expect(result.id).toBe(submissionId);
      expect(result.ownerName).toBe('Test Organization');
    });

    it('should throw error when submission not found', async () => {
      const submissionId = 'non-existent';

      const selectMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: selectMock,
      });

      await expect(getSubmissionById(submissionId)).rejects.toThrow('Submission not found');
    });
  });
});