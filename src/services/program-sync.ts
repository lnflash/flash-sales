import { programApi, activityToProgram, programToActivity } from '@/lib/supabase-program-api';
import { 
  Activity, 
  WeeklyGoals, 
  WeeklyProgram 
} from '@/types/weekly-program';
import { 
  ProgramActivity, 
  ProgramWeeklyGoals, 
  ProgramSyncStatus 
} from '@/types/program-sync';
import { getUserFromStorage } from '@/lib/auth';

// Sync interval (5 minutes)
const SYNC_INTERVAL = 5 * 60 * 1000;

// Offline detection
let isOnline = typeof window !== 'undefined' ? navigator.onLine : true;

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    isOnline = true;
    // Trigger sync when coming back online
    ProgramSyncService.getInstance().syncNow();
  });

  window.addEventListener('offline', () => {
    isOnline = false;
  });
}

export class ProgramSyncService {
  private static instance: ProgramSyncService;
  private syncTimeout: NodeJS.Timeout | null = null;
  private isSyncing = false;
  private listeners: Array<(status: ProgramSyncStatus) => void> = [];

  private constructor() {
    // Start periodic sync
    this.startPeriodicSync();
  }

  static getInstance(): ProgramSyncService {
    if (!ProgramSyncService.instance) {
      ProgramSyncService.instance = new ProgramSyncService();
    }
    return ProgramSyncService.instance;
  }

  // Subscribe to sync status updates
  onSyncStatusChange(callback: (status: ProgramSyncStatus) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(status: ProgramSyncStatus) {
    this.listeners.forEach(cb => cb(status));
  }

  // Get current sync status
  async getSyncStatus(): Promise<ProgramSyncStatus> {
    const user = getUserFromStorage();
    if (!user?.userId) {
      return {
        userId: '',
        username: '',
        syncStatus: 'error',
        errorMessage: 'User not authenticated',
        errorCount: 1,
        activitiesSynced: 0,
        goalsSynced: false,
        customTypesSynced: false
      };
    }

    try {
      const status = await programApi.getSyncStatus(user.userId);
      return status || {
        userId: user.userId,
        username: user.username || '',
        syncStatus: this.isSyncing ? 'syncing' : 'success',
        errorMessage: undefined,
        errorCount: 0,
        activitiesSynced: 0,
        goalsSynced: false,
        customTypesSynced: false
      };
    } catch (error) {
      return {
        userId: user.userId,
        username: user.username || '',
        syncStatus: 'error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorCount: 1,
        activitiesSynced: 0,
        goalsSynced: false,
        customTypesSynced: false
      };
    }
  }

  // Manual sync trigger
  async syncNow(): Promise<void> {
    if (!isOnline || this.isSyncing) {
      console.log('[ProgramSync] Skipping sync:', { isOnline, isSyncing: this.isSyncing });
      return;
    }

    const user = getUserFromStorage();
    if (!user?.userId || !user?.username) {
      console.log('[ProgramSync] No authenticated user, skipping sync');
      return;
    }

    this.isSyncing = true;
    const syncStatus: ProgramSyncStatus = {
      userId: user.userId,
      username: user.username,
      syncStatus: 'syncing',
      errorMessage: undefined,
      errorCount: 0,
      activitiesSynced: 0,
      goalsSynced: false,
      customTypesSynced: false
    };

    this.notifyListeners(syncStatus);

    try {
      console.log('[ProgramSync] Starting sync for user:', user.username);

      // Get local data from localStorage
      const localData = this.getLocalProgramData();
      
      // Sync activities
      await this.syncActivities(user.userId, user.username, localData.activities);
      
      // Sync weekly goals
      await this.syncWeeklyGoals(user.userId, user.username, localData.weeklyGoals);
      
      // Sync custom activity types
      await this.syncCustomActivityTypes(user.userId, localData.customActivityTypes);

      // Update sync status
      syncStatus.errorMessage = undefined;
      syncStatus.syncStatus = 'success';
      syncStatus.lastSyncAt = new Date().toISOString();
      await programApi.updateSyncStatus(syncStatus);

      console.log('[ProgramSync] Sync completed successfully');
    } catch (error) {
      console.error('[ProgramSync] Sync failed:', error);
      syncStatus.errorMessage = error instanceof Error ? error.message : 'Sync failed';
      syncStatus.syncStatus = 'error';
      syncStatus.errorCount++;
      await programApi.updateSyncStatus(syncStatus);
    } finally {
      this.isSyncing = false;
      this.notifyListeners(syncStatus);
    }
  }

  private async syncActivities(userId: string, username: string, localActivities: Activity[]) {
    try {
      // Convert local activities to program activities
      const programActivities: ProgramActivity[] = localActivities.map(activity => 
        activityToProgram(activity, userId, username)
      );

      // Bulk upsert to Supabase
      if (programActivities.length > 0) {
        await programApi.bulkUpsertActivities(programActivities);
      }

      // Fetch any activities created on other devices
      const currentWeekStart = this.getWeekStartDate(new Date());
      const remoteActivities = await programApi.getActivities(userId, currentWeekStart);

      // Merge remote activities into local storage
      if (remoteActivities.length > 0) {
        this.mergeRemoteActivities(remoteActivities);
      }
    } catch (error) {
      console.error('[ProgramSync] Failed to sync activities:', error);
      throw error;
    }
  }

  private async syncWeeklyGoals(userId: string, username: string, localGoals: Record<string, WeeklyGoals>) {
    try {
      // Convert and sync each week's goals
      for (const [weekStart, goals] of Object.entries(localGoals)) {
        const programGoals: ProgramWeeklyGoals = {
          userId,
          username,
          weekStart,
          ...goals
        };

        await programApi.upsertWeeklyGoals(programGoals);
      }

      // Fetch remote goals
      const currentWeekStart = this.getWeekStartDate(new Date());
      const remoteGoals = await programApi.getWeeklyGoals(userId, currentWeekStart);

      // Merge remote goals into local storage
      if (remoteGoals) {
        this.mergeRemoteGoals(remoteGoals);
      }
    } catch (error) {
      console.error('[ProgramSync] Failed to sync weekly goals:', error);
      throw error;
    }
  }

  private async syncCustomActivityTypes(userId: string, customTypes: string[]) {
    try {
      const user = getUserFromStorage();
      const username = user?.username || '';
      
      // Add each custom type to Supabase
      for (const typeName of customTypes) {
        await programApi.addCustomActivityType({
          userId,
          username,
          typeName,
          usageCount: 1,
          lastUsedAt: new Date().toISOString()
        });
      }

      // Fetch remote custom types
      const remoteTypes = await programApi.getCustomActivityTypes(userId);
      
      // Merge remote types into local storage
      if (remoteTypes.length > 0) {
        this.mergeRemoteCustomTypes(remoteTypes);
      }
    } catch (error) {
      console.error('[ProgramSync] Failed to sync custom activity types:', error);
      throw error;
    }
  }

  private getLocalProgramData() {
    const weeklyProgramStr = localStorage.getItem('weeklyProgram');
    const weeklyProgram = weeklyProgramStr ? JSON.parse(weeklyProgramStr) : {};
    
    // Extract all activities
    const activities: Activity[] = [];
    const weeklyGoals: Record<string, WeeklyGoals> = {};
    
    Object.entries(weeklyProgram).forEach(([weekKey, weekData]: [string, any]) => {
      if (weekData.activities) {
        activities.push(...weekData.activities);
      }
      if (weekData.goals) {
        weeklyGoals[weekKey] = weekData.goals;
      }
    });

    // Get custom activity types
    const customTypesStr = localStorage.getItem('customActivityTypes');
    const customActivityTypes = customTypesStr ? JSON.parse(customTypesStr) : [];

    return {
      activities,
      weeklyGoals,
      customActivityTypes
    };
  }

  private mergeRemoteActivities(remoteActivities: ProgramActivity[]) {
    const weeklyProgramStr = localStorage.getItem('weeklyProgram');
    const weeklyProgram = weeklyProgramStr ? JSON.parse(weeklyProgramStr) : {};

    // Group remote activities by week
    const activitiesByWeek = new Map<string, Activity[]>();
    
    remoteActivities.forEach(remoteActivity => {
      const activity = programToActivity(remoteActivity);
      const weekStart = this.getWeekStartDate(new Date(activity.date));
      
      if (!activitiesByWeek.has(weekStart)) {
        activitiesByWeek.set(weekStart, []);
      }
      activitiesByWeek.get(weekStart)!.push(activity);
    });

    // Merge into weekly program
    activitiesByWeek.forEach((activities, weekStart) => {
      if (!weeklyProgram[weekStart]) {
        weeklyProgram[weekStart] = { activities: [] };
      }

      // Merge activities, avoiding duplicates
      const existingIds = new Set(weeklyProgram[weekStart].activities.map((a: Activity) => a.id));
      const newActivities = activities.filter(a => !existingIds.has(a.id));
      
      weeklyProgram[weekStart].activities.push(...newActivities);
    });

    localStorage.setItem('weeklyProgram', JSON.stringify(weeklyProgram));
  }

  private mergeRemoteGoals(remoteGoals: ProgramWeeklyGoals) {
    const weeklyProgramStr = localStorage.getItem('weeklyProgram');
    const weeklyProgram = weeklyProgramStr ? JSON.parse(weeklyProgramStr) : {};

    const weekStart = remoteGoals.weekStart;
    if (!weeklyProgram[weekStart]) {
      weeklyProgram[weekStart] = {};
    }

    weeklyProgram[weekStart].goals = {
      calls: remoteGoals.calls,
      meetings: remoteGoals.meetings,
      proposals: remoteGoals.proposals,
      followUps: remoteGoals.followUps,
      newContacts: remoteGoals.newContacts
    };

    localStorage.setItem('weeklyProgram', JSON.stringify(weeklyProgram));
  }

  private mergeRemoteCustomTypes(remoteTypes: string[]) {
    const customTypesStr = localStorage.getItem('customActivityTypes');
    const localTypes = customTypesStr ? JSON.parse(customTypesStr) : [];
    
    // Merge, avoiding duplicates
    const allTypes = new Set([...localTypes, ...remoteTypes]);
    
    localStorage.setItem('customActivityTypes', JSON.stringify(Array.from(allTypes)));
  }

  private getWeekStartDate(date: Date): string {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d.toISOString().split('T')[0];
  }

  private startPeriodicSync() {
    // Initial sync after a short delay
    setTimeout(() => this.syncNow(), 5000);

    // Set up periodic sync
    this.syncTimeout = setInterval(() => {
      this.syncNow();
    }, SYNC_INTERVAL);
  }

  // Clean up
  destroy() {
    if (this.syncTimeout) {
      clearInterval(this.syncTimeout);
      this.syncTimeout = null;
    }
  }
}

// Export singleton instance
export const programSyncService = ProgramSyncService.getInstance();