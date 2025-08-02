import {
  saveUserToStorage,
  getUserFromStorage,
  removeUserFromStorage,
  isLoggedIn,
  isSessionValid,
  logout,
  User
} from '@/lib/auth';
import { getUserRole } from '@/types/roles';

// Mock the roles module
jest.mock('@/types/roles', () => ({
  getUserRole: jest.fn()
}));

describe('auth', () => {
  const USER_STORAGE_KEY = 'flash_dashboard_user';
  
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
    
    // Default getUserRole mock behavior
    (getUserRole as jest.Mock).mockImplementation((username: string) => {
      if (username.toLowerCase() === 'flash') return 'Flash Admin';
      return 'Flash Sales Rep';
    });
  });

  describe('saveUserToStorage', () => {
    it('should save user to localStorage with role', () => {
      const user = {
        username: 'testuser',
        userId: '123',
        loggedInAt: Date.now()
      };

      saveUserToStorage(user);

      const saved = localStorage.getItem(USER_STORAGE_KEY);
      expect(saved).toBeTruthy();
      
      const parsedUser = JSON.parse(saved!);
      expect(parsedUser).toEqual({
        ...user,
        role: 'Flash Sales Rep'
      });
    });

    it('should assign Flash Admin role for flash username', () => {
      const user = {
        username: 'flash',
        userId: '456',
        loggedInAt: Date.now()
      };

      saveUserToStorage(user);

      const saved = localStorage.getItem(USER_STORAGE_KEY);
      const parsedUser = JSON.parse(saved!);
      expect(parsedUser.role).toBe('Flash Admin');
    });

    it('should not save if window is undefined', () => {
      const windowSpy = jest.spyOn(window, 'window', 'get');
      windowSpy.mockImplementation(() => undefined as any);

      const user = {
        username: 'testuser',
        userId: '123',
        loggedInAt: Date.now()
      };

      saveUserToStorage(user);

      expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();

      windowSpy.mockRestore();
    });
  });

  describe('getUserFromStorage', () => {
    it('should retrieve user from localStorage', () => {
      const user: User = {
        username: 'testuser',
        userId: '123',
        role: 'Flash Sales Rep',
        loggedInAt: Date.now()
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      const retrieved = getUserFromStorage();
      expect(retrieved).toEqual(user);
    });

    it('should return null if no user in localStorage', () => {
      const retrieved = getUserFromStorage();
      expect(retrieved).toBeNull();
    });

    it('should return null for invalid user data', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify({ invalid: 'data' }));

      const retrieved = getUserFromStorage();
      expect(retrieved).toBeNull();
      // After invalid data, storage should be cleared
      expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
      
      consoleSpy.mockRestore();
    });

    it('should add role for backward compatibility', () => {
      const userWithoutRole = {
        username: 'testuser',
        userId: '123',
        loggedInAt: Date.now()
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userWithoutRole));

      const retrieved = getUserFromStorage();
      expect(retrieved?.role).toBe('Flash Sales Rep');
    });

    it('should return null for expired session', () => {
      const user: User = {
        username: 'testuser',
        userId: '123',
        role: 'Flash Sales Rep',
        loggedInAt: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      const retrieved = getUserFromStorage();
      expect(retrieved).toBeNull();
      expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
    });

    it('should return user for valid session', () => {
      const user: User = {
        username: 'testuser',
        userId: '123',
        role: 'Flash Sales Rep',
        loggedInAt: Date.now() - (23 * 60 * 60 * 1000) // 23 hours ago
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      const retrieved = getUserFromStorage();
      expect(retrieved).toEqual(user);
    });

    it('should handle JSON parse errors', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      localStorage.setItem(USER_STORAGE_KEY, 'invalid json');

      const retrieved = getUserFromStorage();
      expect(retrieved).toBeNull();
      expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('removeUserFromStorage', () => {
    it('should remove user from localStorage', () => {
      localStorage.setItem(USER_STORAGE_KEY, 'test data');

      removeUserFromStorage();

      expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
    });

    it('should handle removal when no user exists', () => {
      removeUserFromStorage();
      expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when user exists', () => {
      const user: User = {
        username: 'testuser',
        userId: '123',
        role: 'Flash Sales Rep',
        loggedInAt: Date.now()
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      expect(isLoggedIn()).toBe(true);
    });

    it('should return false when no user exists', () => {
      expect(isLoggedIn()).toBe(false);
    });

    it('should return false for expired session', () => {
      const user: User = {
        username: 'testuser',
        userId: '123',
        role: 'Flash Sales Rep',
        loggedInAt: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      expect(isLoggedIn()).toBe(false);
    });
  });

  describe('isSessionValid', () => {
    it('should return true for valid session', () => {
      const user: User = {
        username: 'testuser',
        userId: '123',
        role: 'Flash Sales Rep',
        loggedInAt: Date.now() - (10 * 60 * 60 * 1000) // 10 hours ago
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      expect(isSessionValid()).toBe(true);
    });

    it('should return false for expired session', () => {
      const user: User = {
        username: 'testuser',
        userId: '123',
        role: 'Flash Sales Rep',
        loggedInAt: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      expect(isSessionValid()).toBe(false);
    });

    it('should return false when no user exists', () => {
      expect(isSessionValid()).toBe(false);
    });

    it('should handle edge case at exact 24 hours', () => {
      const user: User = {
        username: 'testuser',
        userId: '123',
        role: 'Flash Sales Rep',
        loggedInAt: Date.now() - (24 * 60 * 60 * 1000) // Exactly 24 hours ago
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      expect(isSessionValid()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should remove user from storage', () => {
      const user: User = {
        username: 'testuser',
        userId: '123',
        role: 'Flash Sales Rep',
        loggedInAt: Date.now()
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      logout();

      expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
      expect(isLoggedIn()).toBe(false);
    });

    it('should handle logout when not logged in', () => {
      logout();
      expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull();
    });
  });
});