import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Activity, WeeklyGoals, WeeklyProgram, ActivityStatus } from '@/types/weekly-program';
import { getUserFromStorage } from '@/lib/auth';
import { programSyncService } from '@/services/program-sync';
import { ProgramSyncStatus } from '@/types/program-sync';

interface WeeklyProgramState {
  currentWeek: string; // ISO date of Monday
  goals: WeeklyGoals;
  activities: Activity[];
  customActivityTypes: string[]; // Store used custom activity types
  currentUserId: string | null; // Track current user
  syncStatus: ProgramSyncStatus | null;
  
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
  setSyncStatus: (status: ProgramSyncStatus) => void;
  triggerSync: () => Promise<void>;
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
  followUps: 20,
  newContacts: 15
};

// Helper to trigger sync after state changes
const syncAfterChange = () => {
  // Debounce sync to avoid too many calls
  if (typeof window !== 'undefined') {
    clearTimeout((window as any).__syncTimeout);
    (window as any).__syncTimeout = setTimeout(() => {
      programSyncService.syncNow().catch(console.error);
    }, 2000);
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
      syncStatus: null,

      setCurrentWeek: (week) => {
        set({ currentWeek: week });
        const user = getUserFromStorage();
        const userId = user?.userId || null;
        
        // Update currentUserId if needed
        if (userId && userId !== get().currentUserId) {
          set({ currentUserId: userId });
        }
      },

      setGoals: (goals) => {
        set({ goals });
        syncAfterChange();
      },

      addActivity: (activity) => {
        const user = getUserFromStorage();
        const userId = user?.userId || 'anonymous';
        
        const newActivity: Activity = {
          ...activity,
          id: Date.now().toString(),
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        set((state) => ({
          activities: [...state.activities, newActivity],
          currentUserId: userId
        }));
        
        syncAfterChange();
      },

      updateActivity: (id, updates) => {
        set((state) => ({
          activities: state.activities.map((activity) =>
            activity.id === id
              ? { ...activity, ...updates, updatedAt: new Date().toISOString() }
              : activity
          )
        }));
        
        syncAfterChange();
      },

      deleteActivity: (id) => {
        set((state) => ({
          activities: state.activities.filter((activity) => activity.id !== id)
        }));
        
        syncAfterChange();
      },

      updateActivityStatus: (id, status) => {
        const updates: Partial<Activity> = { status };
        
        // Add completion timestamp if completing
        if (status === 'completed') {
          updates.completedAt = new Date().toISOString();
        }
        
        get().updateActivity(id, updates);
      },

      getActivitiesByDate: (date) => {
        return get().activities.filter((activity) => activity.date === date);
      },

      getWeeklyMetrics: () => {
        const activities = get().activities.filter(
          (activity) => activity.date >= get().currentWeek
        );

        const completedActivities = activities.filter(
          (activity) => activity.status === 'completed'
        );

        return {
          completedCalls: completedActivities.filter((a) => a.type === 'call').length,
          completedMeetings: completedActivities.filter((a) => a.type === 'meeting').length,
          completedProposals: completedActivities.filter((a) => a.type === 'proposal').length,
          completedFollowUps: completedActivities.filter((a) => a.type === 'follow_up').length,
          totalActivities: activities.length,
          completedActivities: completedActivities.length,
          inProgressActivities: activities.filter((a) => a.status === 'in_progress').length,
          completionRate: activities.length > 0 
            ? Math.round((completedActivities.length / activities.length) * 100)
            : 0
        };
      },

      duplicateActivity: (activityId, newDate) => {
        const activity = get().activities.find(a => a.id === activityId);
        if (!activity) return;

        const user = getUserFromStorage();
        const userId = user?.userId || 'anonymous';

        const newActivity: Activity = {
          ...activity,
          id: Date.now().toString(),
          date: newDate,
          status: 'planned',
          userId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: undefined,
          outcome: undefined,
          nextSteps: undefined
        };

        set((state) => ({
          activities: [...state.activities, newActivity]
        }));
        
        syncAfterChange();
      },

      clearWeek: () => {
        const user = getUserFromStorage();
        const userId = user?.userId || null;
        
        set((state) => ({ 
          activities: state.activities.filter((a) => {
            // If there's no userId on the activity, keep it (legacy data)
            if (!a.userId) return true;
            // Keep activities from other users
            return a.userId && a.userId !== userId;
          }), 
          goals: defaultGoals 
        }));
        
        syncAfterChange();
      },

      addCustomActivityType: (typeName) => {
        set((state) => {
          // Only add if it doesn't already exist
          if (!state.customActivityTypes.includes(typeName)) {
            syncAfterChange();
            return { customActivityTypes: [...state.customActivityTypes, typeName] };
          }
          return state;
        });
      },

      setSyncStatus: (status) => {
        set({ syncStatus: status });
      },

      triggerSync: async () => {
        try {
          await programSyncService.syncNow();
        } catch (error) {
          console.error('[WeeklyProgramStore] Sync failed:', error);
        }
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

// Set up sync status listener
if (typeof window !== 'undefined') {
  programSyncService.onSyncStatusChange((status) => {
    useWeeklyProgramStore.getState().setSyncStatus(status);
  });
}