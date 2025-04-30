import { calculateRepStats, SalesRepStats } from './rep-stats-calculator';
import { Submission } from '@/types/submission';

describe('rep-stats-calculator', () => {
  const mockSubmissions: Submission[] = [
    {
      id: 1,
      ownerName: 'Business A',
      packageSeen: true,
      interestLevel: 4,
      signedUp: true,
      timestamp: '2023-01-01T12:00:00Z',
      username: 'rep1'
    },
    {
      id: 2,
      ownerName: 'Business B',
      packageSeen: false,
      interestLevel: 2,
      signedUp: false,
      timestamp: '2023-01-02T12:00:00Z',
      username: 'rep1'
    },
    {
      id: 3,
      ownerName: 'Business C',
      packageSeen: true,
      interestLevel: 5,
      signedUp: true,
      timestamp: '2023-01-03T12:00:00Z',
      username: 'rep2'
    },
    {
      id: 4,
      ownerName: 'Business D',
      packageSeen: true,
      interestLevel: 3,
      signedUp: false,
      timestamp: '2023-01-04T12:00:00Z',
      username: 'rep2'
    },
    {
      id: 5,
      ownerName: 'Business E',
      packageSeen: true,
      interestLevel: 4,
      signedUp: true,
      timestamp: '2023-01-05T12:00:00Z',
      username: 'rep3'
    }
  ];

  test('should return empty array when no submissions', () => {
    const result = calculateRepStats([]);
    expect(result).toEqual([]);
  });

  test('should calculate correct stats for each rep', () => {
    const result = calculateRepStats(mockSubmissions);

    expect(result).toHaveLength(3); // 3 different reps

    // Validate specific rep stats
    const rep1Stats = result.find(r => r.username === 'rep1');
    expect(rep1Stats).toBeDefined();
    expect(rep1Stats?.totalSubmissions).toBe(2);
    expect(rep1Stats?.signedUp).toBe(1);
    expect(rep1Stats?.conversionRate).toBe(50);
    expect(rep1Stats?.avgInterestLevel).toBe(3);
    expect(rep1Stats?.packageSeen).toBe(1);
    expect(rep1Stats?.packageSeenRate).toBe(50);

    const rep2Stats = result.find(r => r.username === 'rep2');
    expect(rep2Stats).toBeDefined();
    expect(rep2Stats?.totalSubmissions).toBe(2);
    expect(rep2Stats?.signedUp).toBe(1);
    expect(rep2Stats?.conversionRate).toBe(50);
    expect(rep2Stats?.avgInterestLevel).toBe(4);
    expect(rep2Stats?.packageSeen).toBe(2);
    expect(rep2Stats?.packageSeenRate).toBe(100);

    const rep3Stats = result.find(r => r.username === 'rep3');
    expect(rep3Stats).toBeDefined();
    expect(rep3Stats?.totalSubmissions).toBe(1);
    expect(rep3Stats?.signedUp).toBe(1);
    expect(rep3Stats?.conversionRate).toBe(100);
    expect(rep3Stats?.avgInterestLevel).toBe(4);
    expect(rep3Stats?.packageSeen).toBe(1);
    expect(rep3Stats?.packageSeenRate).toBe(100);
  });

  test('should handle submissions with missing username', () => {
    const submissionsWithMissingUsername: Submission[] = [
      ...mockSubmissions,
      {
        id: 6,
        ownerName: 'Business F',
        packageSeen: true,
        interestLevel: 5,
        signedUp: true,
        timestamp: '2023-01-06T12:00:00Z',
      }
    ];

    const result = calculateRepStats(submissionsWithMissingUsername);

    // Should have an entry for 'Unknown'
    const unknownStats = result.find(r => r.username === 'Unknown');
    expect(unknownStats).toBeDefined();
    expect(unknownStats?.totalSubmissions).toBe(1);
  });

  test('should sort reps by signups then by total submissions', () => {
    const result = calculateRepStats(mockSubmissions);
    
    // All have 1 signup, but should be ordered by total submissions as tiebreaker
    expect(result[0].username === 'rep1' || result[0].username === 'rep2').toBeTruthy();
    expect(result[2].username).toBe('rep3');
  });
});