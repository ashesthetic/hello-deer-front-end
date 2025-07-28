/**
 * Utility functions for date input handling
 */

/**
 * Ensures a date input field shows the date picker when clicked
 * @param inputElement The date input element
 */
export const ensureDatePicker = (inputElement: HTMLInputElement) => {
  // Force the date picker to show by programmatically focusing and clicking
  inputElement.focus();
  inputElement.click();
};

/**
 * Formats a date string for display in a date input
 * @param dateString The date string to format
 * @returns Formatted date string (YYYY-MM-DD)
 */
export const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  
  return date.toISOString().split('T')[0];
};

/**
 * Gets today's date in the format required for date inputs
 * @returns Today's date in YYYY-MM-DD format
 */
export const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Sets up enhanced date input behavior
 * @param inputElement The date input element to enhance
 */
export const setupDateInput = (inputElement: HTMLInputElement) => {
  // Add click handler to ensure date picker shows
  inputElement.addEventListener('click', () => {
    // Small delay to ensure the click event is processed
    setTimeout(() => {
      inputElement.focus();
    }, 10);
  });

  // Add focus handler to ensure date picker shows on focus
  inputElement.addEventListener('focus', () => {
    // Trigger a click to show the date picker
    inputElement.click();
  });
}; 