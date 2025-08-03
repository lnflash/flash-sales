import { useState, useEffect } from 'react';
import { Activity, WeeklyGoals } from '@/types/weekly-program';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, subWeeks } from 'date-fns';
import { programApi, programToActivity } from '@/lib/supabase-program-api';
import { ProgramActivity, ProgramWeeklyGoals } from '@/types/program-sync';
import { getUserFromStorage } from '@/lib/auth';

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

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        const targetWeek = subWeeks(new Date(), weekOffset);
        const weekStart = startOfWeek(targetWeek, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(targetWeek, { weekStartsOn: 1 });
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');

        // Check if current user is admin
        const user = getUserFromStorage();
        const isAdmin = user?.role === 'Admin' || user?.role === 'Flash Admin';

        let allActivities: ProgramActivity[] = [];
        let allGoals: ProgramWeeklyGoals[] = [];

        if (isAdmin) {
          // Admin can see all users' data
          allActivities = await programApi.getAllUsersActivities(weekStartStr);
          allGoals = await programApi.getAllUsersWeeklyGoals(weekStartStr);
        } else {
          // Regular users only see their own data
          if (user?.userId) {
            allActivities = await programApi.getActivities(user.userId, weekStartStr);
            const userGoals = await programApi.getWeeklyGoals(user.userId, weekStartStr);
            allGoals = userGoals ? [userGoals] : [];
          }
        }

        // Group activities by user
        const activitiesByUser = new Map<string, ProgramActivity[]>();
        const goalsByUser = new Map<string, ProgramWeeklyGoals>();

        allActivities.forEach(activity => {
          const key = `${activity.userId}|${activity.username}`;
          if (!activitiesByUser.has(key)) {
            activitiesByUser.set(key, []);
          }
          activitiesByUser.get(key)!.push(activity);
        });

        allGoals.forEach(goals => {
          const key = `${goals.userId}|${goals.username}`;
          goalsByUser.set(key, goals);
        });

        // Build rep data
        const data: RepProgramData[] = [];

        activitiesByUser.forEach((userActivities, key) => {
          const [userId, username] = key.split('|');
          const userGoals = goalsByUser.get(key);
          
          // Convert ProgramActivity to Activity
          const activities = userActivities.map(programToActivity);
          
          // Use user's goals or defaults
          const goals: WeeklyGoals = userGoals ? {
            calls: userGoals.calls,
            meetings: userGoals.meetings,
            proposals: userGoals.proposals,
            followUps: userGoals.followUps,
            newContacts: userGoals.newContacts
          } : defaultGoals;
          
          // Calculate metrics
          const completed = activities.filter(a => a.status === 'completed');
          const byType = completed.reduce((acc, activity) => {
            acc[activity.type] = (acc[activity.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          // Calculate daily distribution
          const dailyActivities = activities.reduce((acc, activity) => {
            acc[activity.date] = (acc[activity.date] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const sortedDays = Object.entries(dailyActivities).sort(([, a], [, b]) => b - a);
          const mostActiveDay = sortedDays[0]?.[0] || '';
          const leastActiveDay = sortedDays[sortedDays.length - 1]?.[0] || '';

          data.push({
            userId,
            username,
            currentWeek: weekStartStr,
            activities,
            goals,
            metrics: {
              totalActivities: activities.length,
              completedActivities: completed.length,
              completionRate: activities.length > 0 
                ? Math.round((completed.length / activities.length) * 100)
                : 0,
              plannedActivities: activities.filter(a => a.status === 'planned').length,
              inProgressActivities: activities.filter(a => a.status === 'in_progress').length,
              cancelledActivities: activities.filter(a => a.status === 'cancelled').length,
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
              averageActivitiesPerDay: activities.length / 5, // Assuming 5 work days
              mostActiveDay,
              leastActiveDay
            }
          });
        });

        // Add users who have goals but no activities
        goalsByUser.forEach((goals, key) => {
          if (!activitiesByUser.has(key)) {
            const [userId, username] = key.split('|');
            
            data.push({
              userId,
              username,
              currentWeek: weekStartStr,
              activities: [],
              goals: {
                calls: goals.calls,
                meetings: goals.meetings,
                proposals: goals.proposals,
                followUps: goals.followUps,
                newContacts: goals.newContacts
              },
              metrics: {
                totalActivities: 0,
                completedActivities: 0,
                completionRate: 0,
                plannedActivities: 0,
                inProgressActivities: 0,
                cancelledActivities: 0,
                completedByType: {},
                goalAchievement: {
                  calls: { current: 0, target: goals.calls, percentage: 0 },
                  meetings: { current: 0, target: goals.meetings, percentage: 0 },
                  proposals: { current: 0, target: goals.proposals, percentage: 0 },
                  followUps: { current: 0, target: goals.followUps, percentage: 0 }
                },
                averageActivitiesPerDay: 0,
                mostActiveDay: '',
                leastActiveDay: ''
              }
            });
          }
        });

        // Sort by username
        data.sort((a, b) => a.username.localeCompare(b.username));

        setRepsData(data);
      } catch (error) {
        console.error('Error fetching reps data:', error);
        setRepsData([]);
      }
      
      setIsLoading(false);
    };

    fetchData();
  }, [weekOffset]);

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