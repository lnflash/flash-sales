import { useState, useEffect } from 'react';
import { Activity, WeeklyGoals } from '@/types/weekly-program';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks } from 'date-fns';
import { useWeeklyProgramStore } from '@/stores/useWeeklyProgramStore';
import { getSubmissions } from '@/lib/supabase-api';

export interface RepProgramData {
  userId: string;
  username: string;
  currentWeek: string;
  activities: Activity[];
  goals: WeeklyGoals;
  metrics: {
    totalActivities: number;
    completedActivities: number;
    completionRate: number;
    plannedActivities: number;
    inProgressActivities: number;
    cancelledActivities: number;
    completedByType: Record<string, number>;
    goalAchievement: {
      calls: { current: number; target: number; percentage: number };
      meetings: { current: number; target: number; percentage: number };
      proposals: { current: number; target: number; percentage: number };
      followUps: { current: number; target: number; percentage: number };
    };
    averageActivitiesPerDay: number;
    mostActiveDay: string;
    leastActiveDay: string;
  };
}

// Default goals for reps who haven't set their own
const defaultGoals: WeeklyGoals = {
  calls: 50,
  meetings: 10,
  proposals: 5,
  followUps: 30,
  newContacts: 20
};

export const useAllRepsProgram = (weekOffset: number = 0) => {
  const [repsData, setRepsData] = useState<RepProgramData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { activities: allActivities, goals: globalGoals } = useWeeklyProgramStore();

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Get all submissions to find unique sales reps
        const response = await getSubmissions();
        const uniqueReps = new Map<string, { userId: string; username: string }>();
        
        // Extract unique reps from submissions
        if (response.data) {
          response.data.forEach(submission => {
            if (submission.username) {
              uniqueReps.set(submission.username, {
                userId: submission.username,
                username: submission.username
              });
            }
          });
        }
        
        // Add the known Flash sales reps if they're not already in the list
        const knownReps = ['Tatiana_1', 'rogimon', 'Chala', 'charms'];
        knownReps.forEach(rep => {
          if (!uniqueReps.has(rep)) {
            uniqueReps.set(rep, {
              userId: rep,
              username: rep
            });
          }
        });

        const targetWeek = subWeeks(new Date(), weekOffset);
        const weekStart = startOfWeek(targetWeek, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(targetWeek, { weekStartsOn: 1 });

        const data: RepProgramData[] = Array.from(uniqueReps.values()).map(rep => {
        // Filter activities for this rep and week
        const repActivities = allActivities.filter(activity => {
          // Skip if no date
          if (!activity.date) return false;
          
          const activityDate = new Date(activity.date);
          
          // Handle legacy activities without userId
          if (!activity.userId) {
            // For now, don't show legacy activities in rep tracking
            return false;
          }
          
          return activity.userId === rep.userId && 
                 activityDate >= weekStart && 
                 activityDate <= weekEnd;
        });
        
        // Use global goals or defaults
        const goals = globalGoals || defaultGoals;
        
        // Calculate metrics
        const completed = repActivities.filter(a => a.status === 'completed');
        const byType = completed.reduce((acc, activity) => {
          acc[activity.type] = (acc[activity.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Calculate daily distribution
        const dailyActivities = repActivities.reduce((acc, activity) => {
          acc[activity.date] = (acc[activity.date] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const sortedDays = Object.entries(dailyActivities).sort(([, a], [, b]) => b - a);
        const mostActiveDay = sortedDays[0]?.[0] || '';
        const leastActiveDay = sortedDays[sortedDays.length - 1]?.[0] || '';

        return {
          userId: rep.userId,
          username: rep.username,
          currentWeek: format(weekStart, 'yyyy-MM-dd'),
          activities: repActivities,
          goals,
          metrics: {
            totalActivities: repActivities.length,
            completedActivities: completed.length,
            completionRate: repActivities.length > 0 
              ? Math.round((completed.length / repActivities.length) * 100)
              : 0,
            plannedActivities: repActivities.filter(a => a.status === 'planned').length,
            inProgressActivities: repActivities.filter(a => a.status === 'in_progress').length,
            cancelledActivities: repActivities.filter(a => a.status === 'cancelled').length,
            completedByType: byType,
            goalAchievement: {
              calls: {
                current: byType.call || 0,
                target: goals.calls,
                percentage: Math.round(((byType.call || 0) / goals.calls) * 100)
              },
              meetings: {
                current: byType.meeting || 0,
                target: goals.meetings,
                percentage: Math.round(((byType.meeting || 0) / goals.meetings) * 100)
              },
              proposals: {
                current: byType.proposal || 0,
                target: goals.proposals,
                percentage: Math.round(((byType.proposal || 0) / goals.proposals) * 100)
              },
              followUps: {
                current: byType.follow_up || 0,
                target: goals.followUps,
                percentage: Math.round(((byType.follow_up || 0) / goals.followUps) * 100)
              }
            },
            averageActivitiesPerDay: repActivities.length / 5, // Assuming 5 work days
            mostActiveDay,
            leastActiveDay
          }
        };
      });

      setRepsData(data);
      } catch (error) {
        console.error('Error fetching reps data:', error);
        // Fallback to known reps with empty data
        const knownReps = ['Tatiana_1', 'rogimon', 'Chala', 'charms'];
        const data = knownReps.map(username => ({
          userId: username,
          username,
          currentWeek: format(startOfWeek(subWeeks(new Date(), weekOffset), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
          activities: [],
          goals: defaultGoals,
          metrics: {
            totalActivities: 0,
            completedActivities: 0,
            completionRate: 0,
            plannedActivities: 0,
            inProgressActivities: 0,
            cancelledActivities: 0,
            completedByType: {},
            goalAchievement: {
              calls: { current: 0, target: defaultGoals.calls, percentage: 0 },
              meetings: { current: 0, target: defaultGoals.meetings, percentage: 0 },
              proposals: { current: 0, target: defaultGoals.proposals, percentage: 0 },
              followUps: { current: 0, target: defaultGoals.followUps, percentage: 0 }
            },
            averageActivitiesPerDay: 0,
            mostActiveDay: '',
            leastActiveDay: ''
          }
        }));
        setRepsData(data);
      }
      
      setIsLoading(false);
    };

    fetchData();
  }, [weekOffset, allActivities, globalGoals]);

  const aggregateMetrics = {
    totalReps: repsData.length,
    totalActivities: repsData.reduce((sum, rep) => sum + rep.metrics.totalActivities, 0),
    totalCompleted: repsData.reduce((sum, rep) => sum + rep.metrics.completedActivities, 0),
    averageCompletionRate: repsData.length > 0
      ? Math.round(repsData.reduce((sum, rep) => sum + rep.metrics.completionRate, 0) / repsData.length)
      : 0,
    topPerformer: repsData.reduce((top, rep) => 
      !top || rep.metrics.completionRate > top.metrics.completionRate ? rep : top
    , null as RepProgramData | null),
    bottomPerformer: repsData.reduce((bottom, rep) => 
      !bottom || rep.metrics.completionRate < bottom.metrics.completionRate ? rep : bottom
    , null as RepProgramData | null)
  };

  return {
    repsData,
    aggregateMetrics,
    isLoading
  };
};