
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
 * If multiple prices are provided (e.g., "12,000/- 13,000/-"), it takes the first one.
 */
export const parseRent = (rent: unknown): number => {
  if (typeof rent === 'number') return Math.floor(rent);
  if (!rent || rent === 'NA') return 0;
  
  // If it's a string with multiple prices, take the first one
  const firstPrice = String(rent).split(/[ \n,]/)[0];
  
  // Remove commas, currency symbols, and /- suffix
  const cleaned = firstPrice.replace(/[₹,/-]/g, '').trim();
  const parsed = parseInt(cleaned, 10);
  
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * Parses a distance matrix string into an array of DistanceMatrixItem.
 * Format: "ALLEN SUPATH-450M \n VIDHYAPEETH (PW)-600M"
 */
export const parseDistanceMatrix = (data: string): { name: string; distance: number }[] => {
  if (!data || data === 'NA') return [];
  
  // Split by newline or comma
  const entries = data.split(/[\n,]/).map(e => e.trim()).filter(e => e !== '');
  
  return entries.map(entry => {
    // Handle formats like "ALLEN SUPATH-450M" or "ALLEN SUPATH 450M"
    // We look for the last dash or space before a number
    const lastDashIndex = entry.lastIndexOf('-');
    const lastSpaceIndex = entry.lastIndexOf(' ');
    const splitIndex = lastDashIndex !== -1 ? lastDashIndex : lastSpaceIndex;
    
    if (splitIndex === -1) return null;
    
    const name = entry.substring(0, splitIndex).trim();
    const distanceStr = entry.substring(splitIndex + 1).trim().toLowerCase();
    
    let distance = 0;
    if (distanceStr.includes('km')) {
      distance = parseFloat(distanceStr.replace('km', ''));
    } else if (distanceStr.includes('m')) {
      distance = parseFloat(distanceStr.replace('m', '')) / 1000;
    } else {
      distance = parseFloat(distanceStr);
      if (distance > 50) distance = distance / 1000; // Heuristic: if > 50, it's probably meters
    }
    
    return isNaN(distance) ? null : { name, distance };
  }).filter((item): item is { name: string; distance: number } => item !== null);
};

/**
 * Handles multi-link strings separated by commas or newlines.
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
