/**
 * Standardized date utilities for the entire project
 * This ensures consistent date handling and prevents timezone issues
 */

/**
 * Parse a date string safely without timezone conversion
 * @param dateString - Date string in YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss format
 * @returns Date object in local timezone
 */
export const parseDateSafely = (dateString: string): Date => {
  // Handle both YYYY-MM-DD and YYYY-MM-DDTHH:mm:ss formats
  const datePart = dateString.split('T')[0];
  const [year, month, day] = datePart.split('-').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

/**
 * Format date for display (e.g., "Jul 21")
 * @param dateString - Date string to format
 * @returns Formatted date string
 */
export const formatDateForDisplay = (dateString: string): string => {
  const date = parseDateSafely(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Format date for API (YYYY-MM-DD format)
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateForAPI = (date: Date): string => {
  return date.toLocaleDateString('en-CA'); // en-CA gives YYYY-MM-DD format
};

/**
 * Get today's date in YYYY-MM-DD format
 * @returns Today's date string
 */
export const getTodayString = (): string => {
  return formatDateForAPI(new Date());
};

/**
 * Get a date that is N days before today
 * @param days - Number of days to subtract
 * @returns Date string in YYYY-MM-DD format
 */
export const getDaysBeforeToday = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return formatDateForAPI(date);
};

/**
 * Create a date range from start to end date
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Array of date strings in YYYY-MM-DD format
 */
export const createDateRange = (startDate: Date, endDate: Date): string[] => {
  const dates: string[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    dates.push(formatDateForAPI(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}; 