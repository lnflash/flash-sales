export class ProgramSyncService {
  private user: any = null;
  private autoSyncTimer: any = null;
  private statusListeners: Set<(status: any) => void> = new Set();
  private status = {
    isSyncing: false,
    lastSyncAt: null,
    syncError: null,
    isOnline: true,
  };

  setUser(user: any) {
    this.user = user;
  }

  getStatus() {
    return { ...this.status };
  }

  async syncNow() {
    if (!this.user || !this.status.isOnline) {
      return;
    }
    
    this.status.isSyncing = true;
    this.notifyListeners();
    
    try {
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 100));
      this.status.lastSyncAt = new Date().toISOString();
      this.status.syncError = null;
    } catch (error: any) {
      this.status.syncError = error.message;
    } finally {
      this.status.isSyncing = false;
      this.notifyListeners();
    }
  }

  startAutoSync() {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
    }
    this.autoSyncTimer = setInterval(() => {
      this.syncNow();
    }, 5 * 60 * 1000);
  }

  stopAutoSync() {
    if (this.autoSyncTimer) {
      clearInterval(this.autoSyncTimer);
      this.autoSyncTimer = null;
    }
  }

  onStatusChange(listener: (status: any) => void) {
    this.statusListeners.add(listener);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.statusListeners.forEach(listener => {
      listener(this.getStatus());
    });
  }
}

export const programSyncService = new ProgramSyncService();