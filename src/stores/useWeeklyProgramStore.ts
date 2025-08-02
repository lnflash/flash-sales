import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Activity, WeeklyGoals, WeeklyProgram, ActivityStatus } from '@/types/weekly-program';
import { getUserFromStorage } from '@/lib/auth';

interface WeeklyProgramState {
  currentWeek: string; // ISO date of Monday
  goals: WeeklyGoals;
  activities: Activity[];
  customActivityTypes: string[]; // Store used custom activity types
  currentUserId: string | null; // Track current user
  
  // Actions
  setCurrentWeek: (week: string) => void;
  setGoals: (goals: WeeklyGoals) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  updateActivityStatus: (id: string, status: ActivityStatus) => void;
  getActivitiesByDate: (date: string) => Activity[];
  getWeeklyMetrics: () => {
    completedCalls: number;
    completedMeetings: number;
    completedProposals: number;
    completedFollowUps: number;
    totalActivities: number;
    completedActivities: number;
    inProgressActivities: number;
    completionRate: number;
  };
  duplicateActivity: (activityId: string, newDate: string) => void;
  clearWeek: () => void;
  addCustomActivityType: (typeName: string) => void;
}

// Helper to get Monday of the current week
const getMondayOfWeek = (date: Date = new Date()): string => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
};

const defaultGoals: WeeklyGoals = {
  calls: 50,
  meetings: 10,
  proposals: 5,
  followUps: 30,
  newContacts: 20
};

// Helper to get current user ID with proper client-side check
const getCurrentUserId = (): string => {
  if (typeof window === 'undefined') {
    // Server-side rendering
    return 'anonymous';
  }
  
  try {
    const user = getUserFromStorage();
    return user?.username || user?.userId || 'anonymous';
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return 'anonymous';
  }
};

export const useWeeklyProgramStore = create<WeeklyProgramState>()(
  persist(
    (set, get) => ({
      currentWeek: getMondayOfWeek(),
      goals: defaultGoals,
      activities: [],
      customActivityTypes: [],
      currentUserId: null,

      setCurrentWeek: (week) => set({ currentWeek: week }),

      setGoals: (goals) => set({ goals }),

      addActivity: (activityData) => {
        const userId = getCurrentUserId();
        const newActivity: Activity = {
          ...activityData,
          id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        // If it's a custom type, add it to the list of custom types
        if (activityData.type === 'custom' && activityData.customType) {
          get().addCustomActivityType(activityData.customType);
        }

        set((state) => ({
          activities: [...state.activities, newActivity]
        }));
      },

      updateActivity: (id, updates) => {
        set((state) => ({
          activities: state.activities.map((activity) =>
            activity.id === id
              ? { ...activity, ...updates, updatedAt: new Date().toISOString() }
              : activity
          )
        }));
      },

      deleteActivity: (id) => {
        set((state) => ({
          activities: state.activities.filter((activity) => activity.id !== id)
        }));
      },

      updateActivityStatus: (id, status) => {
        const now = new Date().toISOString();
        set((state) => ({
          activities: state.activities.map((activity) =>
            activity.id === id
              ? { 
                  ...activity, 
                  status,
                  updatedAt: now,
                  // If completing, set the time to now if not already set
                  ...(status === 'completed' && !activity.time ? { time: new Date().toTimeString().slice(0, 5) } : {})
                }
              : activity
          )
        }));
      },

      getActivitiesByDate: (date) => {
        const { activities } = get();
        const userId = getCurrentUserId();
        // Filter activities, handling both new activities with userId and legacy activities
        return activities.filter((activity) => {
          // If activity has no userId (legacy), show it to everyone
          if (!activity.userId) return true;
          // Otherwise, only show if it belongs to current user
          return activity.date === date && activity.userId === userId;
        });
      },

      getWeeklyMetrics: () => {
        const { activities } = get();
        const userId = getCurrentUserId();
        const weekActivities = activities.filter((activity) => {
          const activityDate = new Date(activity.date);
          const weekStart = new Date(get().currentWeek);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          
          // Handle legacy activities without userId
          if (!activity.userId) {
            return activityDate >= weekStart && activityDate <= weekEnd;
          }
          
          return activity.userId === userId && activityDate >= weekStart && activityDate <= weekEnd;
        });

        const completed = weekActivities.filter(a => a.status === 'completed');
        const inProgress = weekActivities.filter(a => a.status === 'in_progress');

        return {
          completedCalls: completed.filter(a => a.type === 'call').length,
          completedMeetings: completed.filter(a => a.type === 'meeting').length,
          completedProposals: completed.filter(a => a.type === 'proposal').length,
          completedFollowUps: completed.filter(a => a.type === 'follow_up').length,
          totalActivities: weekActivities.length,
          completedActivities: completed.length,
          inProgressActivities: inProgress.length,
          completionRate: weekActivities.length > 0 
            ? Math.round((completed.length / weekActivities.length) * 100)
            : 0
        };
      },

      duplicateActivity: (activityId, newDate) => {
        const activity = get().activities.find(a => a.id === activityId);
        if (activity) {
          const { id, userId, createdAt, updatedAt, ...activityData } = activity;
          get().addActivity({
            ...activityData,
            date: newDate,
            status: 'planned'
          });
        }
      },

      clearWeek: () => {
        const userId = getCurrentUserId();
        set((state) => ({ 
          activities: state.activities.filter(a => {
            // If anonymous user, don't clear anything
            if (userId === 'anonymous') return true;
            // Keep activities from other users
            return a.userId && a.userId !== userId;
          }), 
          goals: defaultGoals 
        }));
      },

      addCustomActivityType: (typeName) => {
        set((state) => {
          // Only add if it doesn't already exist
          if (!state.customActivityTypes.includes(typeName)) {
            return { customActivityTypes: [...state.customActivityTypes, typeName] };
          }
          return state;
        });
      }
    }),
    {
      name: 'weekly-program-storage',
      // Migration to add userId to existing activities
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Version 0 -> 1: Add userId to activities
          // Don't assign userId during migration - let it be handled when user logs in
          return {
            ...persistedState,
            activities: (persistedState.activities || [])
          };
        }
        return persistedState;
      },
      version: 1,
      partialize: (state) => ({
        activities: state.activities,
        goals: state.goals,
        currentWeek: state.currentWeek,
        customActivityTypes: state.customActivityTypes
      })
    }
  )
);