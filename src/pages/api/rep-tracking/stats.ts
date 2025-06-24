import type { NextApiRequest, NextApiResponse } from 'next';
import { RepPerformanceStats } from '../../../types/rep-tracking';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // For demo purposes, we'll generate some sample data
  // In production, this would calculate from actual stored data
  const sampleStats: RepPerformanceStats[] = [
    {
      repName: 'John Smith',
      totalWeeks: 12,
      mondayUpdatesSubmitted: 10,
      tuesdayCallsAttended: 11,
      mondayUpdateRate: 83.3,
      tuesdayCallRate: 91.7,
      currentStreak: {
        mondayUpdates: 3,
        tuesdayCall: 5
      },
      lastFourWeeks: {
        mondayUpdates: 3,
        tuesdayCalls: 4
      }
    },
    {
      repName: 'Sarah Johnson',
      totalWeeks: 12,
      mondayUpdatesSubmitted: 12,
      tuesdayCallsAttended: 10,
      mondayUpdateRate: 100,
      tuesdayCallRate: 83.3,
      currentStreak: {
        mondayUpdates: 12,
        tuesdayCall: 2
      },
      lastFourWeeks: {
        mondayUpdates: 4,
        tuesdayCalls: 3
      }
    },
    {
      repName: 'Mike Davis',
      totalWeeks: 12,
      mondayUpdatesSubmitted: 8,
      tuesdayCallsAttended: 9,
      mondayUpdateRate: 66.7,
      tuesdayCallRate: 75,
      currentStreak: {
        mondayUpdates: 1,
        tuesdayCall: 2
      },
      lastFourWeeks: {
        mondayUpdates: 2,
        tuesdayCalls: 3
      }
    }
  ];

  res.status(200).json(sampleStats);
}