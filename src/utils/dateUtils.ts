/**
 * Date utility functions for Alberta timezone
 */

const ALBERTA_TIMEZONE = 'America/Edmonton';

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
 * Format a date string to Alberta timezone
 */
export const formatDateToAlberta = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-CA', {
    timeZone: ALBERTA_TIMEZONE,
    ...options
  });
};

/**
 * Format a date string to Alberta timezone with time
 */
export const formatDateTimeToAlberta = (dateString: string, options?: Intl.DateTimeFormatOptions): string => {
  const date = new Date(dateString);
  return date.toLocaleString('en-CA', {
    timeZone: ALBERTA_TIMEZONE,
    ...options
  });
};

/**
 * Get today's date in Alberta timezone (YYYY-MM-DD format)
 */
export const getTodayAlberta = (): string => {
  const now = new Date();
  return now.toLocaleDateString('en-CA', {
    timeZone: ALBERTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
};

/**
 * Get today's date in YYYY-MM-DD format (legacy function)
 */
export const getTodayString = (): string => {
  return getTodayAlberta();
};

/**
 * Format a date for display in Alberta timezone
 */
export const formatDateForDisplay = (dateString: string): string => {
  return formatDateToAlberta(dateString, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format a date for input fields (YYYY-MM-DD)
 */
export const formatDateForInput = (dateString: string): string => {
  return formatDateToAlberta(dateString, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
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
 * Format currency for display (e.g., "$1,234.56")
 * @param amount - Amount to format
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
  }).format(amount);
}; 