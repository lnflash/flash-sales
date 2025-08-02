import {
  formatDate,
  formatRelativeTime,
  getCurrentDateISOString,
  formatDateForInput,
  getFirstDayOfMonth,
  getDateDaysAgo,
  formatDateRange
} from '@/utils/date-formatter';

describe('date-formatter', () => {
  describe('formatDate', () => {
    it('should format date string correctly', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const result = formatDate(dateString);
      // Check the format matches the expected pattern
      expect(result).toMatch(/\w{3} \d{1,2}, \d{4}/);
    });

    it('should handle different date formats', () => {
      const date = new Date('2023-12-25T00:00:00Z');
      const dateString = date.toISOString();
      const result = formatDate(dateString);
      expect(result).toMatch(/Dec \d{1,2}, 2023/);
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      // Mock current date to ensure consistent tests
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return "just now" for very recent times', () => {
      const dateString = '2024-01-15T11:59:30Z';
      const result = formatRelativeTime(dateString);
      expect(result).toBe('just now');
    });

    it('should return "1 minute ago" for one minute ago', () => {
      const dateString = '2024-01-15T11:59:00Z';
      const result = formatRelativeTime(dateString);
      expect(result).toBe('1 minute ago');
    });

    it('should return minutes ago for recent times', () => {
      const dateString = '2024-01-15T11:30:00Z';
      const result = formatRelativeTime(dateString);
      expect(result).toBe('30 minutes ago');
    });

    it('should return "1 hour ago" for one hour ago', () => {
      const dateString = '2024-01-15T11:00:00Z';
      const result = formatRelativeTime(dateString);
      expect(result).toBe('1 hour ago');
    });

    it('should return hours ago for same day', () => {
      const dateString = '2024-01-15T09:00:00Z';
      const result = formatRelativeTime(dateString);
      expect(result).toBe('3 hours ago');
    });

    it('should return "yesterday" for one day ago', () => {
      const dateString = '2024-01-14T12:00:00Z';
      const result = formatRelativeTime(dateString);
      expect(result).toBe('yesterday');
    });

    it('should return days ago for recent dates', () => {
      const dateString = '2024-01-10T12:00:00Z';
      const result = formatRelativeTime(dateString);
      expect(result).toBe('5 days ago');
    });

    it('should return formatted date for dates over 30 days ago', () => {
      const dateString = '2023-12-01T12:00:00Z';
      const result = formatRelativeTime(dateString);
      expect(result).toBe('Dec 1, 2023');
    });
  });

  describe('getCurrentDateISOString', () => {
    it('should return current date as ISO string', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      const result = getCurrentDateISOString();
      expect(result).toBe('2024-01-15T12:00:00.000Z');

      jest.useRealTimers();
    });

    it('should return a valid ISO string', () => {
      const result = getCurrentDateISOString();
      expect(() => new Date(result)).not.toThrow();
      expect(new Date(result).toISOString()).toBe(result);
    });
  });

  describe('formatDateForInput', () => {
    it('should format date for HTML input', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const result = formatDateForInput(dateString);
      expect(result).toBe('2024-01-15');
    });

    it('should handle dates with single digit months and days', () => {
      const dateString = '2024-03-05T10:30:00Z';
      const result = formatDateForInput(dateString);
      expect(result).toBe('2024-03-05');
    });

    it('should pad single digits with zeros', () => {
      // Create date in local timezone to avoid timezone issues
      const date = new Date(2024, 0, 1); // January 1, 2024
      const result = formatDateForInput(date.toISOString());
      expect(result).toBe('2024-01-01');
    });
  });

  describe('getFirstDayOfMonth', () => {
    it('should return first day of current month', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));

      const result = getFirstDayOfMonth();
      const date = new Date(result);
      
      expect(date.getDate()).toBe(1);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getFullYear()).toBe(2024);
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);

      jest.useRealTimers();
    });
  });

  describe('getDateDaysAgo', () => {
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-15T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should return date from specified days ago', () => {
      const result = getDateDaysAgo(5);
      const date = new Date(result);
      
      expect(date.getDate()).toBe(10);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getFullYear()).toBe(2024);
    });

    it('should return today for 0 days ago', () => {
      const result = getDateDaysAgo(0);
      const date = new Date(result);
      
      expect(date.getDate()).toBe(15);
      expect(date.getMonth()).toBe(0); // January
      expect(date.getFullYear()).toBe(2024);
    });

    it('should handle month boundaries', () => {
      const result = getDateDaysAgo(20);
      const date = new Date(result);
      
      expect(date.getDate()).toBe(26);
      expect(date.getMonth()).toBe(11); // December
      expect(date.getFullYear()).toBe(2023);
    });

    it('should set time to start of day', () => {
      const result = getDateDaysAgo(1);
      const date = new Date(result);
      
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
    });
  });

  describe('formatDateRange', () => {
    it('should format date range correctly', () => {
      const startDate = '2024-01-01T00:00:00Z';
      const endDate = '2024-01-31T23:59:59Z';
      const result = formatDateRange(startDate, endDate);
      
      // Check format pattern - may span years due to timezone
      expect(result).toMatch(/\w{3} \d{1,2}, \d{4} - \w{3} \d{1,2}, \d{4}/);
      expect(result).toContain(' - ');
    });

    it('should handle different months', () => {
      const startDate = new Date(2024, 0, 15).toISOString(); // Jan 15
      const endDate = new Date(2024, 1, 15).toISOString(); // Feb 15
      const result = formatDateRange(startDate, endDate);
      
      expect(result).toMatch(/Jan \d{1,2}, 2024 - Feb \d{1,2}, 2024/);
    });

    it('should handle different years', () => {
      const startDate = new Date(2023, 11, 25).toISOString(); // Dec 25
      const endDate = new Date(2024, 0, 5).toISOString(); // Jan 5
      const result = formatDateRange(startDate, endDate);
      
      expect(result).toMatch(/Dec \d{1,2}, 2023 - Jan \d{1,2}, 2024/);
    });
  });
});