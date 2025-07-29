import { saveUserToStorage, getUserFromStorage, isLoggedIn, logout } from './auth';

describe('Auth Library', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('saveUserToStorage', () => {
    it('saves user data to localStorage', () => {
      const userData = {
        username: 'testuser',
        userId: 'user123',
        loggedInAt: Date.now(),
      };

      saveUserToStorage(userData);

      const stored = localStorage.getItem('flash_dashboard_user');
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(userData);
    });

    it('overwrites existing user data', () => {
      const userData1 = {
        username: 'user1',
        userId: 'id1',
        loggedInAt: Date.now(),
      };

      const userData2 = {
        username: 'user2',
        userId: 'id2',
        loggedInAt: Date.now(),
      };

      saveUserToStorage(userData1);
      saveUserToStorage(userData2);

      const stored = localStorage.getItem('flash_dashboard_user');
      expect(JSON.parse(stored!)).toEqual(userData2);
    });
  });

  describe('getUserFromStorage', () => {
    it('retrieves user data from localStorage', () => {
      const userData = {
        username: 'testuser',
        userId: 'user123',
        loggedInAt: Date.now(),
      };

      localStorage.setItem('flash_dashboard_user', JSON.stringify(userData));

      const retrieved = getUserFromStorage();
      expect(retrieved).toEqual(userData);
    });

    it('returns null when no user data exists', () => {
      const retrieved = getUserFromStorage();
      expect(retrieved).toBeNull();
    });

    it('returns null when localStorage contains invalid JSON', () => {
      localStorage.setItem('flash_dashboard_user', 'invalid-json');
      
      const retrieved = getUserFromStorage();
      expect(retrieved).toBeNull();
    });

    it('returns null when session is expired (older than 24 hours)', () => {
      const userData = {
        username: 'testuser',
        userId: 'user123',
        loggedInAt: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      };

      localStorage.setItem('flash_dashboard_user', JSON.stringify(userData));

      const retrieved = getUserFromStorage();
      expect(retrieved).toBeNull();
      expect(localStorage.getItem('flash_dashboard_user')).toBeNull();
    });

    it('returns user data when session is still valid', () => {
      const userData = {
        username: 'testuser',
        userId: 'user123',
        loggedInAt: Date.now() - (23 * 60 * 60 * 1000), // 23 hours ago
      };

      localStorage.setItem('flash_dashboard_user', JSON.stringify(userData));

      const retrieved = getUserFromStorage();
      expect(retrieved).toEqual(userData);
    });
  });

  describe('isLoggedIn', () => {
    it('returns true when valid user exists', () => {
      const userData = {
        username: 'testuser',
        userId: 'user123',
        loggedInAt: Date.now(),
      };

      localStorage.setItem('flash_dashboard_user', JSON.stringify(userData));

      expect(isLoggedIn()).toBe(true);
    });

    it('returns false when no user exists', () => {
      expect(isLoggedIn()).toBe(false);
    });

    it('returns false when session is expired', () => {
      const userData = {
        username: 'testuser',
        userId: 'user123',
        loggedInAt: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
      };

      localStorage.setItem('flash_dashboard_user', JSON.stringify(userData));

      expect(isLoggedIn()).toBe(false);
    });
  });

  describe('logout', () => {
    it('removes user data from localStorage', () => {
      const userData = {
        username: 'testuser',
        userId: 'user123',
        loggedInAt: Date.now(),
      };

      localStorage.setItem('flash_dashboard_user', JSON.stringify(userData));
      expect(localStorage.getItem('flash_dashboard_user')).toBeTruthy();

      logout();

      expect(localStorage.getItem('flash_dashboard_user')).toBeNull();
    });

    it('handles logout when no user exists', () => {
      expect(() => logout()).not.toThrow();
      expect(localStorage.getItem('flash_dashboard_user')).toBeNull();
    });
  });
});