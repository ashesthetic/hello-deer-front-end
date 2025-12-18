/**
 * Converts cents (integer) to dollars (decimal)
 * Example: 2034 -> 20.34
 */
export const centsToDollars = (cents: number | undefined): number | undefined => {
  if (cents === undefined || cents === null) return undefined;
  return cents / 100;
};

/**
 * Converts dollars (decimal) to cents (integer)
 * Example: 20.34 -> 2034
 */
export const dollarsToCents = (dollars: number | undefined): number | undefined => {
  if (dollars === undefined || dollars === null) return undefined;
  return Math.round(dollars * 100);
};

/**
 * Formats a number as currency string
 * Example: 20.34 -> "$20.34"
 */
export const formatCurrency = (amount: number | undefined): string => {
  if (amount === undefined || amount === null) return '$0.00';
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(amount);
};

/**
 * Converts a string input to cents for storage
 * Handles both decimal and integer inputs
 */
export const parseCurrencyInput = (value: string): number | undefined => {
  if (!value || value.trim() === '') return undefined;
  
  // Remove any non-numeric characters except decimal point
  const cleanValue = value.replace(/[^\d.]/g, '');
  
  // If it's already a decimal number, convert to cents
  if (cleanValue.includes('.')) {
    const dollars = parseFloat(cleanValue);
    return isNaN(dollars) ? undefined : Math.round(dollars * 100);
  }
  
  // If it's an integer, treat as cents
  const cents = parseInt(cleanValue, 10);
  return isNaN(cents) ? undefined : cents;
};

/**
 * Formats cents for display in input fields
 * Converts cents to dollars for user-friendly display
 */
export const formatCentsForInput = (cents: number | undefined): string => {
  if (cents === undefined || cents === null) return '';
  return (cents / 100).toFixed(2);
}; 