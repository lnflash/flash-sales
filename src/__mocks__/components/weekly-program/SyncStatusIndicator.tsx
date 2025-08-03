import React from 'react';
import { useWeeklyProgramStore } from '@/stores/useWeeklyProgramStore';

export const SyncStatusIndicator: React.FC = () => {
  const { syncStatus, triggerSync } = useWeeklyProgramStore();
  
  const getStatusText = () => {
    if (!syncStatus.isOnline) return 'Offline';
    if (syncStatus.isSyncing) return 'Syncing...';
    if (syncStatus.syncError) return 'Sync Error';
    if (syncStatus.lastSyncAt) {
      return `Last synced ${getRelativeTime(syncStatus.lastSyncAt)}`;
    }
    return 'Never synced';
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'less than a minute ago';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  const getStatusClass = () => {
    if (!syncStatus.isOnline) return 'text-muted-foreground';
    if (syncStatus.isSyncing) return 'animate-spin';
    if (syncStatus.syncError) return 'text-red-600';
    return 'text-green-600';
  };

  return (
    <div className="flex items-center gap-2">
      <span data-testid="sync-status-icon" className={getStatusClass()}>
        {syncStatus.isSyncing ? '⟳' : syncStatus.syncError ? '!' : '✓'}
      </span>
      <span>{getStatusText()}</span>
      <button 
        onClick={triggerSync}
        disabled={!syncStatus.isOnline || syncStatus.isSyncing}
        aria-label="sync now"
      >
        Sync
      </button>
    </div>
  );
};