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
  const date = parseDateSafely(dateString);
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
  const albertaDate = now.toLocaleDateString('en-CA', {
    timeZone: ALBERTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // Convert from MM/DD/YYYY to YYYY-MM-DD
  const [month, day, year] = albertaDate.split('/');
  return `${year}-${month}-${day}`;
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

/**
 * Create a date in Alberta timezone
 * @param year - Year
 * @param month - Month (0-11)
 * @param day - Day of month
 * @returns Date string in YYYY-MM-DD format in Alberta timezone
 */
export const createAlbertaDate = (year: number, month: number, day: number): string => {
  const date = new Date(year, month, day);
  const albertaDateString = date.toLocaleDateString('en-CA', {
    timeZone: ALBERTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // Convert from MM/DD/YYYY to YYYY-MM-DD
  const [monthStr, dayStr, yearStr] = albertaDateString.split('/');
  return `${yearStr}-${monthStr}-${dayStr}`;
};

/**
 * Get current date in Alberta timezone
 * @returns Date object representing current date in Alberta timezone
 */
export const getCurrentAlbertaDate = (): Date => {
  const now = new Date();
  const albertaDateString = now.toLocaleDateString('en-CA', {
    timeZone: ALBERTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const [month, day, year] = albertaDateString.split('/').map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

/**
 * Convert a date to the format expected by the backend API
 * This ensures dates are sent in the correct timezone format
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date string in the format expected by the backend
 */
export const formatDateForBackend = (dateString: string): string => {
  // The backend expects dates in Alberta timezone
  // We need to ensure the date is interpreted as Alberta timezone, not UTC
  const date = new Date(dateString + 'T00:00:00');
  return date.toLocaleDateString('en-CA', {
    timeZone: ALBERTA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '-');
}; 