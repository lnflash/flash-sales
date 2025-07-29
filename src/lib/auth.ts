"use client";

import { UserRole, getUserRole } from '@/types/roles';

// Simple authentication using localStorage
const USER_STORAGE_KEY = 'flash_dashboard_user';

export interface User {
  username: string;
  userId: string;
  role: UserRole;
  loggedInAt: number;
}

export function saveUserToStorage(user: Omit<User, 'role'>): void {
  if (typeof window !== 'undefined') {
    // Add role based on username
    const userWithRole: User = {
      ...user,
      role: getUserRole(user.username),
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userWithRole));
  }
}

export function getUserFromStorage(): User | null {
  if (typeof window !== 'undefined') {
    try {
      const userData = localStorage.getItem(USER_STORAGE_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        
        // Validate user object structure
        if (!user.username) {
          console.error("Invalid user data in localStorage: missing username");
          return null;
        }
        
        // Ensure user has a role (for backward compatibility)
        if (!user.role) {
          user.role = getUserRole(user.username);
        }
        
        // Check if session is still valid
        const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
        const now = Date.now();
        const sessionExpiry = user.loggedInAt + sessionDuration;
        
        if (now >= sessionExpiry) {
          console.log("User session expired");
          localStorage.removeItem(USER_STORAGE_KEY);
          return null;
        }
        
        return user;
      }
    } catch (error) {
      console.error("Error parsing user data from localStorage:", error);
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }
  return null;
}

export function removeUserFromStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function isLoggedIn(): boolean {
  return getUserFromStorage() !== null;
}

// Function to check if the session is still valid (e.g., not expired)
export function isSessionValid(): boolean {
  const user = getUserFromStorage();
  
  if (!user) return false;
  
  // Session valid for 24 hours
  const sessionDuration = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  const now = Date.now();
  const sessionExpiry = user.loggedInAt + sessionDuration;
  
  return now < sessionExpiry;
}

// Logout function
export function logout(): void {
  removeUserFromStorage();
}