import React, { useEffect, useState } from 'react';
import { 
  CloudArrowUpIcon, 
  CheckCircleIcon, 
  ExclamationCircleIcon,
  ArrowPathIcon,
  WifiIcon
} from '@heroicons/react/24/outline';
import { WifiIcon as WifiSolidIcon } from '@heroicons/react/24/solid';
import { useWeeklyProgramStore } from '@/stores/useWeeklyProgramStore';
import { programSyncService } from '@/services/program-sync';
import { formatDistanceToNow } from 'date-fns';

export const SyncStatusIndicator: React.FC = () => {
  const { syncStatus, triggerSync } = useWeeklyProgramStore();
  const [isOnline, setIsOnline] = useState(true);
  const [isManualSyncing, setIsManualSyncing] = useState(false);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    // Set initial status
    updateOnlineStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || isManualSyncing) return;
    
    setIsManualSyncing(true);
    try {
      await triggerSync();
    } finally {
      setIsManualSyncing(false);
    }
  };

  const getSyncIcon = () => {
    if (!isOnline) {
      return <WifiIcon className="h-5 w-5 text-muted-foreground" />;
    }

    if (syncStatus?.syncInProgress || isManualSyncing) {
      return <ArrowPathIcon className="h-5 w-5 text-primary animate-spin" />;
    }

    if (syncStatus?.syncError) {
      return <ExclamationCircleIcon className="h-5 w-5 text-destructive" />;
    }

    return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
  };

  const getSyncText = () => {
    if (!isOnline) {
      return 'Offline';
    }

    if (syncStatus?.syncInProgress || isManualSyncing) {
      return 'Syncing...';
    }

    if (syncStatus?.syncError) {
      return 'Sync failed';
    }

    if (syncStatus?.lastSyncAt) {
      const lastSync = new Date(syncStatus.lastSyncAt);
      return `Last synced ${formatDistanceToNow(lastSync, { addSuffix: true })}`;
    }

    return 'Not synced';
  };

  return (
    <div className="flex items-center gap-2">
      {/* Online/Offline indicator */}
      <div className="flex items-center gap-1.5">
        {isOnline ? (
          <WifiSolidIcon className="h-4 w-4 text-green-500" />
        ) : (
          <WifiIcon className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="text-xs text-muted-foreground">
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>

      {/* Sync status */}
      <div className="flex items-center gap-1.5 pl-2 border-l border-border">
        <button
          onClick={handleManualSync}
          disabled={!isOnline || isManualSyncing}
          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={syncStatus?.syncError || getSyncText()}
        >
          {getSyncIcon()}
          <span className="text-xs text-muted-foreground">{getSyncText()}</span>
        </button>
      </div>

      {/* Error tooltip */}
      {syncStatus?.syncError && (
        <div className="relative group">
          <ExclamationCircleIcon className="h-4 w-4 text-destructive cursor-help" />
          <div className="absolute bottom-full right-0 mb-2 p-2 bg-popover border border-border rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            <p className="text-xs text-destructive">{syncStatus.syncError}</p>
          </div>
        </div>
      )}
    </div>
  );
};