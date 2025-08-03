# Hybrid Program of Work Testing Checklist

## Pre-Testing Setup

### 1. Apply Database Migrations ✅
```bash
# Apply the migration to your Supabase instance
supabase db push
```

### 2. Verify Migration Success
- [ ] Check Supabase dashboard for new tables:
  - `program_activities`
  - `program_weekly_goals`
  - `program_custom_activity_types`
  - `program_sync_status`
  - `program_offline_queue`

### 3. Start Development Server
```bash
npm run dev
```

## Core Functionality Tests

### A. Offline-First Storage ✅
- [ ] **Create Activity Offline**
  1. Open browser DevTools → Network → Set to "Offline"
  2. Navigate to Weekly Program of Work
  3. Create a new activity
  4. Verify activity appears immediately in calendar
  5. Check localStorage contains the activity

- [ ] **Edit Activity Offline**
  1. While offline, edit an existing activity
  2. Verify changes are saved locally
  3. Check localStorage is updated

- [ ] **Delete Activity Offline**
  1. While offline, delete an activity
  2. Verify it's removed from the UI
  3. Check localStorage reflects deletion

### B. Online Synchronization ✅
- [ ] **Auto-Sync on Connection**
  1. Create activities while offline
  2. Go back online
  3. Watch sync indicator change from "Offline" to "Syncing" to "Synced"
  4. Verify activities appear in Supabase

- [ ] **Manual Sync**
  1. Click the sync button
  2. Verify sync indicator shows progress
  3. Check last sync time updates

- [ ] **5-Minute Auto-Sync**
  1. Make a change
  2. Wait 5 minutes
  3. Verify automatic sync occurs

### C. CRM Entity Integration ✅
- [ ] **Link to Organization**
  1. Create activity with organization selected
  2. Verify organization name displays correctly
  3. Check Supabase shows correct organization_id

- [ ] **Link to Contact**
  1. Create activity with contact selected
  2. Verify contact name displays
  3. Check Supabase shows correct contact_id

- [ ] **Link to Deal**
  1. Create activity with deal selected
  2. Verify deal name displays
  3. Check Supabase shows correct deal_id

### D. Admin Features ✅
- [ ] **View All Reps' Programs**
  1. Log in as admin (role: 'Flash Management' or 'Flash Admin')
  2. Navigate to Rep Tracking
  3. Click "Program of Work" tab
  4. Verify all reps' activities are visible

- [ ] **Filter by Rep**
  1. Use the rep selector dropdown
  2. Verify activities filter correctly
  3. Check weekly stats update

- [ ] **Export Data**
  1. Click "Export Week" button
  2. Verify CSV download contains all visible activities
  3. Check data format is correct

### E. Multi-Device Sync ✅
- [ ] **Cross-Browser Sync**
  1. Log in on Chrome and Firefox with same account
  2. Create activity in Chrome
  3. Wait for sync or trigger manually
  4. Verify activity appears in Firefox

- [ ] **Conflict Resolution**
  1. Go offline in both browsers
  2. Edit same activity differently
  3. Go online in browser 1, wait for sync
  4. Go online in browser 2
  5. Verify both versions are preserved (latest wins)

### F. Data Persistence ✅
- [ ] **Survives Page Refresh**
  1. Create activities
  2. Refresh the page
  3. Verify all activities remain

- [ ] **Survives Logout/Login**
  1. Create activities
  2. Log out and log back in
  3. Verify activities are restored

- [ ] **Handles Browser Storage Clear**
  1. Create activities and ensure synced
  2. Clear browser storage
  3. Refresh page
  4. Verify activities load from cloud

## Edge Cases & Error Handling

### G. Network Issues ✅
- [ ] **Intermittent Connection**
  1. Toggle network on/off repeatedly
  2. Verify sync queue handles properly
  3. No data loss occurs

- [ ] **Sync Failures**
  1. Create invalid data (if possible)
  2. Verify error indicator appears
  3. Check error is logged but app continues

- [ ] **Large Data Sets**
  1. Create 100+ activities
  2. Verify sync completes successfully
  3. Check performance remains acceptable

### H. User Permissions ✅
- [ ] **Regular User Isolation**
  1. Log in as regular sales rep
  2. Verify can only see own activities
  3. Cannot see other reps' data

- [ ] **RLS Policy Enforcement**
  1. Try to access another user's data via API
  2. Verify access is denied
  3. Check security policies work

## Performance Tests

### I. Load Times ✅
- [ ] Initial page load < 3 seconds
- [ ] Activity creation < 100ms (offline)
- [ ] Sync operation < 5 seconds for typical week

### J. Memory Usage ✅
- [ ] No memory leaks after extended use
- [ ] localStorage doesn't exceed limits
- [ ] Smooth scrolling with many activities

## Verification Queries

Run these in Supabase SQL editor:

```sql
-- Check sync status for all users
SELECT * FROM program_sync_status ORDER BY last_sync_at DESC;

-- View recent activities
SELECT username, type, title, status, created_at 
FROM program_activities 
ORDER BY created_at DESC 
LIMIT 20;

-- Get activity summary by user
SELECT 
  username,
  COUNT(*) as total_activities,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
  MAX(created_at) as last_activity
FROM program_activities
GROUP BY username;

-- Check for sync conflicts
SELECT * FROM program_offline_queue WHERE processed_at IS NULL;
```

## Sign-off

- [ ] All core functionality tests pass
- [ ] No critical bugs found
- [ ] Performance is acceptable
- [ ] Admin features work correctly
- [ ] Data syncs reliably

**Tested by:** _______________  
**Date:** _______________  
**Version:** _______________

## Notes
_Add any issues found or observations during testing:_

---