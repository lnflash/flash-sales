import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { getUserFromStorage, logout as authLogout } from '@/lib/auth';
import type { User } from '@/types/auth';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  // Actions
  initialize: () => void;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: true,
      isAuthenticated: false,
      
      initialize: () => {
        const user = getUserFromStorage();
        set({
          user,
          isAuthenticated: !!user,
          isLoading: false,
        });
      },
      
      login: (user) => {
        // Store in localStorage (handled by auth lib)
        localStorage.setItem('user', JSON.stringify(user));
        set({
          user,
          isAuthenticated: true,
          isLoading: false,
        });
      },
      
      logout: () => {
        authLogout();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },
      
      updateUser: (updates) => {
        set((state) => {
          if (!state.user) return state;
          
          const updatedUser = { ...state.user, ...updates };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          return {
            ...state,
            user: updatedUser,
          };
        });
      },
    }),
    {
      name: 'flash-auth-storage',
      partialize: (state) => ({ user: state.user }), // Only persist user
    }
  )
);