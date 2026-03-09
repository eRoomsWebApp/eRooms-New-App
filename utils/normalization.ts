
/**
 * Normalizes a phone number by removing special characters and keeping only the last 10 digits.
 * Rules:
 * - Remove ( ) - ? + and spaces
 * - Keep only digits
 * - If > 10 digits, take last 10
 */
export const normalizePhone = (phone: string): string => {
  if (!phone) return '';
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  // Take last 10 digits
  return digits.slice(-10);
};

/**
 * Parses a rent string into a clean integer.
 * Example: "12,000/-" -> 12000
 */
export const parseRent = (rent: unknown): number => {
  if (typeof rent === 'number') return Math.floor(rent);
  if (!rent) return 0;
  
  // Remove commas, currency symbols, and /- suffix
  const cleaned = String(rent).replace(/[₹,/-]/g, '').trim();
  const parsed = parseInt(cleaned, 10);
  
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Handles multi-link strings separated by commas.
 * Returns an array of strings.
 */
export const parseMultiLinks = (links: string): string[] => {
  if (!links) return [];
  return links.split(',').map(link => link.trim()).filter(link => link !== '');
};

/**
 * Formats a number as a currency string for display.
 * Example: 12000 -> "12,000/-"
 */
export const formatRentDisplay = (rent: number): string => {
  return `${rent.toLocaleString('en-IN')}/-`;
};
