import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface UserPreferences {
  theme: 'light' | 'dark'
  compactView: boolean
  showNotifications: boolean
  defaultDashboardTab: string
}

interface UIState {
  sidebarCollapsed: boolean
  mobileMenuOpen: boolean
  activeModal: string | null
  filters: {
    dateRange: { start: Date | null; end: Date | null }
    salesRep: string | null
    status: string | null
  }
}

interface AppState {
  // User preferences (persisted)
  preferences: UserPreferences
  setPreferences: (preferences: Partial<UserPreferences>) => void
  
  // UI state (not persisted)
  ui: UIState
  setSidebarCollapsed: (collapsed: boolean) => void
  setMobileMenuOpen: (open: boolean) => void
  setActiveModal: (modal: string | null) => void
  setFilters: (filters: Partial<UIState['filters']>) => void
  
  // Notifications
  notifications: Array<{
    id: string
    type: 'info' | 'success' | 'warning' | 'error'
    title: string
    message?: string
    timestamp: Date
    read: boolean
  }>
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp' | 'read'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // User preferences
      preferences: {
        theme: 'dark',
        compactView: false,
        showNotifications: true,
        defaultDashboardTab: 'overview',
      },
      setPreferences: (newPreferences) =>
        set((state) => ({
          preferences: { ...state.preferences, ...newPreferences },
        })),
      
      // UI state
      ui: {
        sidebarCollapsed: false,
        mobileMenuOpen: false,
        activeModal: null,
        filters: {
          dateRange: { start: null, end: null },
          salesRep: null,
          status: null,
        },
      },
      setSidebarCollapsed: (collapsed) =>
        set((state) => ({
          ui: { ...state.ui, sidebarCollapsed: collapsed },
        })),
      setMobileMenuOpen: (open) =>
        set((state) => ({
          ui: { ...state.ui, mobileMenuOpen: open },
        })),
      setActiveModal: (modal) =>
        set((state) => ({
          ui: { ...state.ui, activeModal: modal },
        })),
      setFilters: (filters) =>
        set((state) => ({
          ui: {
            ...state.ui,
            filters: { ...state.ui.filters, ...filters },
          },
        })),
      
      // Notifications
      notifications: [],
      addNotification: (notification) =>
        set((state) => ({
          notifications: [
            {
              ...notification,
              id: Math.random().toString(36).substr(2, 9),
              timestamp: new Date(),
              read: false,
            },
            ...state.notifications,
          ].slice(0, 50), // Keep only last 50 notifications
        })),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'flash-app-storage',
      partialize: (state) => ({ preferences: state.preferences }), // Only persist preferences
    }
  )
)