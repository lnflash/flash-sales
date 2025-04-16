/**
 * Formats a date string into a human-readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Formats a date string into a relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInDays > 30) {
    return formatDate(dateString);
  } else if (diffInDays === 1) {
    return 'yesterday';
  } else if (diffInDays > 1) {
    return `${diffInDays} days ago`;
  } else if (diffInHours === 1) {
    return '1 hour ago';
  } else if (diffInHours > 1) {
    return `${diffInHours} hours ago`;
  } else if (diffInMinutes === 1) {
    return '1 minute ago';
  } else if (diffInMinutes > 1) {
    return `${diffInMinutes} minutes ago`;
  } else {
    return 'just now';
  }
}

/**
 * Returns the current date as an ISO string
 */
export function getCurrentDateISOString(): string {
  return new Date().toISOString();
}

/**
 * Formats a date for form inputs (YYYY-MM-DD)
 */
export function formatDateForInput(dateString: string): string {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets the first day of the current month
 */
export function getFirstDayOfMonth(): string {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

/**
 * Gets date from N days ago
 */
export function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

/**
 * Formats a date range as a readable string
 */
export function formatDateRange(startDate: string, endDate: string): string {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  return `${start} - ${end}`;
}