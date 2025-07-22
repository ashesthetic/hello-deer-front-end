/**
 * Standardized date utilities for the entire project
 * This ensures consistent date handling and prevents timezone issues
 * All dates are handled in Alberta, Canada timezone (America/Edmonton)
 */

// Alberta timezone constant
export const ALBERTA_TIMEZONE = 'America/Edmonton';

/**
 * Parse a date string safely without timezone conversion
 * @param dateString - Date string in YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss format
 * @returns Date object in Alberta timezone
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
  return date.toLocaleDateString('en-CA', {
    month: 'short',
    day: 'numeric',
    timeZone: ALBERTA_TIMEZONE
  });
};

/**
 * Format date for API (YYYY-MM-DD format)
 * @param date - Date object
 * @returns Date string in YYYY-MM-DD format
 */
export const formatDateForAPI = (date: Date): string => {
  return date.toLocaleDateString('en-CA', { timeZone: ALBERTA_TIMEZONE }); // en-CA gives YYYY-MM-DD format
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

/**
 * Format time for display (e.g., "2:30 PM")
 * @param timeString - Time string in HH:mm format
 * @returns Formatted time string
 */
export const formatTimeForDisplay = (timeString: string): string => {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: ALBERTA_TIMEZONE
  });
};

/**
 * Format date for detailed display (e.g., "Monday, July 21, 2024")
 * @param dateString - Date string to format
 * @returns Formatted date string
 */
export const formatDateDetailed = (dateString: string): string => {
  const date = parseDateSafely(dateString);
  return date.toLocaleDateString('en-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: ALBERTA_TIMEZONE
  });
};

/**
 * Format date for short display (e.g., "Jul 21, 2024")
 * @param dateString - Date string to format
 * @returns Formatted date string
 */
export const formatDateShort = (dateString: string): string => {
  const date = parseDateSafely(dateString);
  return date.toLocaleDateString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: ALBERTA_TIMEZONE
  });
};

/**
 * Format datetime for display (e.g., "Jul 21, 2024 2:30 PM")
 * @param dateTimeString - DateTime string to format
 * @returns Formatted datetime string
 */
export const formatDateTimeForDisplay = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  return date.toLocaleString('en-CA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    timeZone: ALBERTA_TIMEZONE
  });
}; 