// Types for Program of Work Sync functionality

export interface ProgramWeeklyGoals {
  id?: string;
  userId: string;
  username: string;
  weekStart: string; // ISO date
  calls: number;
  meetings: number;
  proposals: number;
  followUps: number;
  newContacts: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProgramActivity {
  id?: string;
  userId: string;
  username: string;
  localId: string; // Maps to localStorage ID
  type: 'call' | 'meeting' | 'proposal' | 'follow_up' | 'email' | 'site_visit' | 'presentation' | 'training' | 'other';
  customType?: string;
  title: string;
  description?: string;
  date: string; // ISO date
  time?: string; // HH:MM format
  duration?: number; // minutes
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
  // CRM entity references
  organizationId?: string;
  dealId?: string;
  contactId?: string;
  entityName?: string; // Display name for the linked entity
  outcome?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  createdAt?: string;
  updatedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  metadata?: Record<string, any>;
}

export interface ProgramCustomActivityType {
  id?: string;
  userId: string;
  username: string;
  typeName: string;
  usageCount: number;
  lastUsedAt?: string;
  createdAt?: string;
}

export interface ProgramSyncStatus {
  id?: string;
  userId: string;
  username: string;
  lastSyncAt?: string;
  lastSyncDirection?: 'to_cloud' | 'from_cloud' | 'bidirectional';
  syncStatus: 'pending' | 'syncing' | 'success' | 'error' | 'conflict';
  errorMessage?: string;
  errorCount: number;
  activitiesSynced: number;
  goalsSynced: boolean;
  customTypesSynced: boolean;
  deviceId?: string;
  appVersion?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProgramOfflineQueueItem {
  id?: string;
  userId: string;
  operation: 'create' | 'update' | 'delete';
  entityType: 'activity' | 'goal' | 'custom_type';
  entityId: string;
  payload: any;
  createdAt?: string;
  processedAt?: string;
  errorMessage?: string;
  retryCount: number;
}

export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  errors: SyncError[];
  conflicts: SyncConflict[];
  lastSyncAt: string;
}

export interface SyncError {
  entityType: string;
  entityId: string;
  error: string;
  timestamp: string;
}

export interface SyncConflict {
  entityType: string;
  entityId: string;
  localValue: any;
  remoteValue: any;
  resolution: 'local' | 'remote' | 'merged';
}

export interface WeeklyActivitySummary {
  userId: string;
  username: string;
  weekStart: string;
  totalActivities: number;
  completedActivities: number;
  cancelledActivities: number;
  completionRate: number;
  callsCompleted: number;
  meetingsCompleted: number;
  proposalsCompleted: number;
  followUpsCompleted: number;
}

export interface SyncState {
  status: 'idle' | 'syncing' | 'error' | 'offline';
  lastSyncAt: Date | null;
  pendingChanges: number;
  errorMessage: string | null;
  isOnline: boolean;
}