import {
  calculateRepStats,
  calculateSignupLeaderboard,
  calculateInterestLeaderboard,
  SalesRepStats
} from '@/utils/rep-stats-calculator';
import { Submission } from '@/types/submission';

describe('rep-stats-calculator', () => {
  const mockSubmissions: Submission[] = [
    {
      id: '1',
      ownerName: 'Business A',
      phoneNumber: '1234567890',
      packageSeen: true,
      decisionMakers: 'Owner',
      interestLevel: 8,
      signedUp: true,
      leadStatus: 'converted',
      specificNeeds: 'POS System',
      username: 'rep1',
      territory: 'Kingston',
      timestamp: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      ownerName: 'Business B',
      phoneNumber: '0987654321',
      packageSeen: false,
      decisionMakers: 'Manager',
      interestLevel: 5,
      signedUp: false,
      leadStatus: 'follow_up',
      specificNeeds: '',
      username: 'rep1',
      territory: 'Kingston',
      timestamp: '2024-01-15T11:00:00Z'
    },
    {
      id: '3',
      ownerName: 'Business C',
      phoneNumber: '5555555555',
      packageSeen: true,
      decisionMakers: 'Owner',
      interestLevel: 9,
      signedUp: true,
      leadStatus: 'converted',
      specificNeeds: 'Training',
      username: 'rep2',
      territory: 'Montego Bay',
      timestamp: '2024-01-15T12:00:00Z'
    },
    {
      id: '4',
      ownerName: 'Business D',
      phoneNumber: '1111111111',
      packageSeen: true,
      decisionMakers: 'Partner',
      interestLevel: 7,
      signedUp: false,
      leadStatus: 'contacted',
      specificNeeds: '',
      username: 'rep2',
      territory: 'Montego Bay',
      timestamp: '2024-01-15T13:00:00Z'
    },
    {
      id: '5',
      ownerName: 'Business E',
      phoneNumber: '2222222222',
      packageSeen: false,
      decisionMakers: '',
      interestLevel: 3,
      signedUp: false,
      leadStatus: 'new',
      specificNeeds: '',
      username: 'rep2',
      territory: 'Montego Bay',
      timestamp: '2024-01-15T14:00:00Z'
    }
  ];

  describe('calculateRepStats', () => {
    it('should return empty array for no submissions', () => {
      const result = calculateRepStats([]);
      expect(result).toEqual([]);
    });

    it('should calculate correct stats for each rep', () => {
      const result = calculateRepStats(mockSubmissions);
      
      expect(result).toHaveLength(2);
      
      // rep2 should be first (3 submissions)
      expect(result[0]).toEqual({
        username: 'rep2',
        totalSubmissions: 3,
        signedUp: 1,
        conversionRate: 33.33333333333333,
        avgInterestLevel: 19 / 3,
        totalInterestScore: 19,
        packageSeen: 2,
        packageSeenRate: 66.66666666666666
      });
      
      // rep1 should be second (2 submissions)
      expect(result[1]).toEqual({
        username: 'rep1',
        totalSubmissions: 2,
        signedUp: 1,
        conversionRate: 50,
        avgInterestLevel: 6.5,
        totalInterestScore: 13,
        packageSeen: 1,
        packageSeenRate: 50
      });
    });

    it('should handle submissions without username', () => {
      const submissionsWithoutUsername: Submission[] = [
        {
          ...mockSubmissions[0],
          username: undefined as any
        }
      ];
      
      const result = calculateRepStats(submissionsWithoutUsername);
      
      expect(result).toHaveLength(1);
      expect(result[0].username).toBe('Unknown');
    });

    it('should sort by totalSubmissions then signedUp', () => {
      const customSubmissions: Submission[] = [
        { ...mockSubmissions[0], username: 'repA' },
        { ...mockSubmissions[1], username: 'repA' },
        { ...mockSubmissions[2], username: 'repB' },
        { ...mockSubmissions[3], username: 'repB' },
        { ...mockSubmissions[4], username: 'repC', signedUp: true },
      ];
      
      const result = calculateRepStats(customSubmissions);
      
      // All have same number of submissions, so should sort by signups
      expect(result[0].username).toBe('repA'); // 2 submissions, 1 signup
      expect(result[1].username).toBe('repB'); // 2 submissions, 1 signup
      expect(result[2].username).toBe('repC'); // 1 submission, 1 signup
    });

    it('should calculate zero rates correctly', () => {
      const noPackageSeenSubmissions: Submission[] = [
        { ...mockSubmissions[0], packageSeen: false, signedUp: false }
      ];
      
      const result = calculateRepStats(noPackageSeenSubmissions);
      
      expect(result[0].packageSeenRate).toBe(0);
      expect(result[0].conversionRate).toBe(0);
    });
  });

  describe('calculateSignupLeaderboard', () => {
    it('should sort by signups then conversion rate', () => {
      const result = calculateSignupLeaderboard(mockSubmissions);
      
      expect(result).toHaveLength(2);
      
      // Both have 1 signup, but rep1 has higher conversion rate (50% vs 33.33%)
      expect(result[0].username).toBe('rep1');
      expect(result[0].signedUp).toBe(1);
      expect(result[0].conversionRate).toBe(50);
      
      expect(result[1].username).toBe('rep2');
      expect(result[1].signedUp).toBe(1);
      expect(result[1].conversionRate).toBe(33.33333333333333);
    });

    it('should prioritize higher signups', () => {
      const customSubmissions: Submission[] = [
        ...mockSubmissions,
        { ...mockSubmissions[0], id: '6', username: 'rep3', signedUp: true },
        { ...mockSubmissions[1], id: '7', username: 'rep3', signedUp: true },
      ];
      
      const result = calculateSignupLeaderboard(customSubmissions);
      
      expect(result[0].username).toBe('rep3');
      expect(result[0].signedUp).toBe(2);
    });
  });

  describe('calculateInterestLeaderboard', () => {
    it('should sort by total interest score then average interest', () => {
      const result = calculateInterestLeaderboard(mockSubmissions);
      
      expect(result).toHaveLength(2);
      
      // rep2 should be first (total interest: 19)
      expect(result[0].username).toBe('rep2');
      expect(result[0].totalInterestScore).toBe(19);
      
      // rep1 should be second (total interest: 13)
      expect(result[1].username).toBe('rep1');
      expect(result[1].totalInterestScore).toBe(13);
    });

    it('should use average interest as tiebreaker', () => {
      const customSubmissions: Submission[] = [
        { ...mockSubmissions[0], username: 'repX', interestLevel: 10 }, // Total: 10, Avg: 10
        { ...mockSubmissions[1], username: 'repY', interestLevel: 5 },  // Total: 10, Avg: 5
        { ...mockSubmissions[2], username: 'repY', interestLevel: 5 },  // (repY total)
      ];
      
      const result = calculateInterestLeaderboard(customSubmissions);
      
      // Both have total interest of 10, but repX has higher average (10 vs 5)
      expect(result[0].username).toBe('repX');
      expect(result[0].avgInterestLevel).toBe(10);
      
      expect(result[1].username).toBe('repY');
      expect(result[1].avgInterestLevel).toBe(5);
    });
  });

  describe('edge cases', () => {
    it('should handle empty array submissions', () => {
      expect(calculateRepStats([])).toEqual([]);
      expect(calculateSignupLeaderboard([])).toEqual([]);
      expect(calculateInterestLeaderboard([])).toEqual([]);
    });

    it('should handle single submission', () => {
      const singleSubmission = [mockSubmissions[0]];
      const result = calculateRepStats(singleSubmission);
      
      expect(result).toHaveLength(1);
      expect(result[0].totalSubmissions).toBe(1);
    });

    it('should handle all zero interest levels', () => {
      const zeroInterestSubmissions: Submission[] = [
        { ...mockSubmissions[0], interestLevel: 0 },
        { ...mockSubmissions[1], interestLevel: 0 }
      ];
      
      const result = calculateRepStats(zeroInterestSubmissions);
      
      expect(result[0].avgInterestLevel).toBe(0);
      expect(result[0].totalInterestScore).toBe(0);
    });
  });
});