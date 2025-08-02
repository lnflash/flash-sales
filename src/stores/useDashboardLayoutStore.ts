import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DashboardLayout, LayoutItem, LAYOUT_PRESETS } from '@/types/dashboard-layout';

interface DashboardLayoutStore {
  layouts: DashboardLayout[];
  activeLayoutId: string | null;
  isEditMode: boolean;
  
  // Actions
  addLayout: (layout: Omit<DashboardLayout, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateLayout: (layoutId: string, items: LayoutItem[]) => void;
  deleteLayout: (layoutId: string) => void;
  setActiveLayout: (layoutId: string) => void;
  toggleEditMode: () => void;
  resetToPreset: (presetId: string) => void;
  duplicateLayout: (layoutId: string, newName: string) => void;
}

const DEFAULT_LAYOUT: DashboardLayout = {
  id: 'default',
  name: 'Default Layout',
  items: LAYOUT_PRESETS[0].layout,
  isDefault: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export const useDashboardLayoutStore = create<DashboardLayoutStore>()(
  persist(
    (set, get) => ({
      layouts: [DEFAULT_LAYOUT],
      activeLayoutId: 'default',
      isEditMode: false,

      addLayout: (layout) => {
        const newLayout: DashboardLayout = {
          ...layout,
          id: `layout-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        set((state) => ({
          layouts: [...state.layouts, newLayout],
          activeLayoutId: newLayout.id
        }));
      },

      updateLayout: (layoutId, items) => {
        set((state) => ({
          layouts: state.layouts.map(layout =>
            layout.id === layoutId
              ? { ...layout, items, updatedAt: new Date().toISOString() }
              : layout
          )
        }));
      },

      deleteLayout: (layoutId) => {
        const state = get();
        
        // Can't delete the default layout
        if (layoutId === 'default') return;
        
        // If deleting the active layout, switch to default
        const newActiveId = state.activeLayoutId === layoutId ? 'default' : state.activeLayoutId;
        
        set({
          layouts: state.layouts.filter(l => l.id !== layoutId),
          activeLayoutId: newActiveId
        });
      },

      setActiveLayout: (layoutId) => {
        set({ activeLayoutId: layoutId });
      },

      toggleEditMode: () => {
        set((state) => ({ isEditMode: !state.isEditMode }));
      },

      resetToPreset: (presetId) => {
        const preset = LAYOUT_PRESETS.find(p => p.id === presetId);
        if (!preset) return;

        const state = get();
        const activeLayout = state.layouts.find(l => l.id === state.activeLayoutId);
        
        if (activeLayout && !activeLayout.isDefault) {
          set((state) => ({
            layouts: state.layouts.map(layout =>
              layout.id === state.activeLayoutId
                ? { 
                    ...layout, 
                    items: preset.layout,
                    updatedAt: new Date().toISOString()
                  }
                : layout
            )
          }));
        }
      },

      duplicateLayout: (layoutId, newName) => {
        const state = get();
        const layoutToDuplicate = state.layouts.find(l => l.id === layoutId);
        
        if (!layoutToDuplicate) return;

        const newLayout: DashboardLayout = {
          id: `layout-${Date.now()}`,
          name: newName,
          items: [...layoutToDuplicate.items],
          isDefault: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        set((state) => ({
          layouts: [...state.layouts, newLayout],
          activeLayoutId: newLayout.id
        }));
      }
    }),
    {
      name: 'dashboard-layout-storage',
      version: 1
    }
  )
);