# Hybrid Program of Work Storage Implementation Plan

## Overview
Implement a hybrid storage approach that keeps Program of Work data in localStorage for offline access while syncing to Supabase for admin visibility and cross-device access.

## Phase 1: Database Setup

### 1.1 Create Supabase Tables
```sql
-- Weekly goals table (per user, per week)
CREATE TABLE program_weekly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  week_start DATE NOT NULL,
  calls INTEGER DEFAULT 50,
  meetings INTEGER DEFAULT 10,
  proposals INTEGER DEFAULT 5,
  follow_ups INTEGER DEFAULT 30,
  new_contacts INTEGER DEFAULT 20,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

-- Program activities table
CREATE TABLE program_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  local_id VARCHAR(255), -- To match localStorage IDs
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  time TIME,
  duration INTEGER, -- minutes
  status VARCHAR(20) DEFAULT 'planned',
  notes TEXT,
  lead_id UUID REFERENCES submissions(id),
  outcome TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, local_id)
);

-- Custom activity types per user
CREATE TABLE program_custom_activity_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  type_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, type_name)
);

-- Sync status tracking
CREATE TABLE program_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  last_sync_at TIMESTAMPTZ,
  sync_status VARCHAR(20) DEFAULT 'pending',
  error_message TEXT,
  activities_synced INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes
CREATE INDEX idx_program_activities_user_date ON program_activities(user_id, date);
CREATE INDEX idx_program_activities_status ON program_activities(status);
CREATE INDEX idx_program_weekly_goals_user_week ON program_weekly_goals(user_id, week_start);

-- Enable RLS
ALTER TABLE program_weekly_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_custom_activity_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_sync_status ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read/write their own data
CREATE POLICY "Users can manage own goals" ON program_weekly_goals
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own activities" ON program_activities
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own activity types" ON program_custom_activity_types
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own sync status" ON program_sync_status
  FOR ALL USING (auth.uid() = user_id);

-- Admins can read all data
CREATE POLICY "Admins can read all goals" ON program_weekly_goals
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('Flash Management', 'Flash Admin')
    )
  );

CREATE POLICY "Admins can read all activities" ON program_activities
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role IN ('Flash Management', 'Flash Admin')
    )
  );
```

## Phase 2: Sync Service Implementation

### 2.1 Create Program of Work API Service
```typescript
// src/services/program-of-work-sync.ts
export class ProgramOfWorkSyncService {
  // Sync from localStorage to Supabase
  async syncToCloud(userId: string): Promise<SyncResult>
  
  // Fetch from Supabase to localStorage
  async syncFromCloud(userId: string): Promise<SyncResult>
  
  // Merge conflict resolution
  async resolveConflicts(local: Activity[], remote: Activity[]): Promise<Activity[]>
  
  // Background sync
  async backgroundSync(): Promise<void>
  
  // Check online status
  isOnline(): boolean
  
  // Queue offline changes
  queueOfflineChange(change: OfflineChange): void
  
  // Process offline queue when online
  async processOfflineQueue(): Promise<void>
}
```

### 2.2 Create Supabase API Functions
```typescript
// src/lib/supabase-program-api.ts
export const programApi = {
  // Activities
  getActivities(userId: string, weekStart: string): Promise<Activity[]>
  createActivity(activity: Activity): Promise<Activity>
  updateActivity(id: string, updates: Partial<Activity>): Promise<Activity>
  deleteActivity(id: string): Promise<void>
  bulkUpsertActivities(activities: Activity[]): Promise<Activity[]>
  
  // Goals
  getWeeklyGoals(userId: string, weekStart: string): Promise<WeeklyGoals>
  upsertWeeklyGoals(userId: string, weekStart: string, goals: WeeklyGoals): Promise<WeeklyGoals>
  
  // Custom Types
  getCustomActivityTypes(userId: string): Promise<string[]>
  addCustomActivityType(userId: string, typeName: string): Promise<void>
  
  // Admin functions
  getAllUsersActivities(weekStart: string): Promise<UserActivity[]>
  getUserActivityMetrics(userId: string, dateRange: DateRange): Promise<ActivityMetrics>
}
```

## Phase 3: Store Updates

### 3.1 Update WeeklyProgramStore
```typescript
// Add to existing store:
interface WeeklyProgramState {
  // ... existing state ...
  
  // Sync state
  syncStatus: 'idle' | 'syncing' | 'error' | 'offline';
  lastSyncAt: Date | null;
  syncError: string | null;
  pendingChanges: number;
  
  // Actions
  syncWithCloud: () => Promise<void>;
  markForSync: () => void;
  setSyncStatus: (status: SyncStatus) => void;
}

// Update actions to trigger sync
// - After addActivity, updateActivity, deleteActivity
// - After setGoals
// - Debounced to avoid too many API calls
```

### 3.2 Create Sync Hook
```typescript
// src/hooks/useProgramSync.ts
export const useProgramSync = () => {
  const { syncStatus, lastSyncAt, pendingChanges, syncWithCloud } = useWeeklyProgramStore();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Monitor online/offline status
  // Auto-sync when coming back online
  // Periodic sync every 5 minutes
  // Manual sync trigger
  
  return {
    syncStatus,
    lastSyncAt,
    pendingChanges,
    isOnline,
    syncNow: syncWithCloud,
  };
}
```

## Phase 4: UI Updates

### 4.1 Add Sync Status Indicator
```typescript
// src/components/weekly-program/SyncStatusIndicator.tsx
- Show sync status (synced, syncing, offline, error)
- Display last sync time
- Show pending changes count
- Manual sync button
- Offline mode indicator
```

### 4.2 Update Rep Tracking Page
```typescript
// Update useAllRepsProgram hook to:
1. First check if user is admin
2. If admin, fetch from Supabase API
3. If regular user, use localStorage
4. Show loading states appropriately
```

## Phase 5: Conflict Resolution

### 5.1 Merge Strategy
```typescript
// When syncing, handle conflicts:
1. Last-write-wins for simple fields
2. Merge arrays (custom types)
3. User choice for complex conflicts
4. Keep audit trail of changes
```

### 5.2 Offline Queue
```typescript
// Queue changes when offline:
1. Store changes in IndexedDB
2. Retry when online
3. Handle errors gracefully
4. Notify user of sync issues
```

## Phase 6: Migration

### 6.1 Initial Data Migration
```typescript
// One-time migration of existing localStorage data:
1. Check for existing localStorage data
2. Map to new schema
3. Bulk insert to Supabase
4. Mark as migrated
```

### 6.2 Gradual Rollout
```typescript
// Feature flag for testing:
1. Enable for specific users first
2. Monitor sync performance
3. Handle edge cases
4. Full rollout
```

## Implementation Timeline

1. **Week 1**: Database setup and API creation
2. **Week 2**: Sync service and conflict resolution
3. **Week 3**: Store updates and UI components
4. **Week 4**: Testing and migration

## Benefits

1. **Offline Support**: Continue working without internet
2. **Admin Visibility**: Managers can see all reps' data
3. **Cross-Device Sync**: Access from any device
4. **Data Backup**: Server-side storage prevents data loss
5. **Performance**: Local-first for fast UI

## Considerations

1. **Conflict Resolution**: Handle concurrent edits
2. **Data Privacy**: Ensure proper RLS policies
3. **Performance**: Batch sync operations
4. **Error Handling**: Graceful degradation
5. **Migration**: Smooth transition for existing users