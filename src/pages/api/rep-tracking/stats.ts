import type { NextApiRequest, NextApiResponse } from 'next';
import { RepPerformanceStats, RepWeeklyData } from '../../../types/rep-tracking';
import { repTrackingData } from './index';

function calculateRepStats(data: RepWeeklyData[]): RepPerformanceStats[] {
  // Group data by rep name
  const repGroups = data.reduce((acc, entry) => {
    if (!acc[entry.repName]) {
      acc[entry.repName] = [];
    }
    acc[entry.repName].push(entry);
    return acc;
  }, {} as Record<string, RepWeeklyData[]>);

  // Calculate stats for each rep
  return Object.entries(repGroups).map(([repName, entries]) => {
    // Sort entries by date ascending for streak calculation
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(a.weekStartDate).getTime() - new Date(b.weekStartDate).getTime()
    );

    const totalWeeks = entries.length;
    const mondayUpdatesSubmitted = entries.filter(e => e.submittedMondayUpdate).length;
    const tuesdayCallsAttended = entries.filter(e => e.attendedTuesdayCall).length;

    // Calculate current streaks
    let mondayStreak = 0;
    let tuesdayStreak = 0;
    
    // Check streaks from most recent entries backwards
    for (let i = sortedEntries.length - 1; i >= 0; i--) {
      if (sortedEntries[i].submittedMondayUpdate) {
        mondayStreak++;
      } else {
        break;
      }
    }

    for (let i = sortedEntries.length - 1; i >= 0; i--) {
      if (sortedEntries[i].attendedTuesdayCall) {
        tuesdayStreak++;
      } else {
        break;
      }
    }

    // Calculate last 4 weeks stats
    const lastFourWeeks = sortedEntries.slice(-4);
    const lastFourMondayUpdates = lastFourWeeks.filter(e => e.submittedMondayUpdate).length;
    const lastFourTuesdayCalls = lastFourWeeks.filter(e => e.attendedTuesdayCall).length;

    return {
      repName,
      totalWeeks,
      mondayUpdatesSubmitted,
      tuesdayCallsAttended,
      mondayUpdateRate: totalWeeks > 0 ? (mondayUpdatesSubmitted / totalWeeks) * 100 : 0,
      tuesdayCallRate: totalWeeks > 0 ? (tuesdayCallsAttended / totalWeeks) * 100 : 0,
      currentStreak: {
        mondayUpdates: mondayStreak,
        tuesdayCall: tuesdayStreak
      },
      lastFourWeeks: {
        mondayUpdates: lastFourMondayUpdates,
        tuesdayCalls: lastFourTuesdayCalls
      }
    };
  });
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const stats = calculateRepStats(repTrackingData);
  
  // Sort by total weeks (most active reps first), then by name
  stats.sort((a, b) => {
    if (b.totalWeeks !== a.totalWeeks) {
      return b.totalWeeks - a.totalWeeks;
    }
    return a.repName.localeCompare(b.repName);
  });

  res.status(200).json(stats);
}