
import { DistanceMatrixItem } from '../types';

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
 * Parses a rent string into an array of clean integers.
 * If multiple prices are provided (e.g., "12,000/- 14,000/-"), it extracts all of them.
 */
export const parseRent = (rent: unknown): number[] => {
  if (typeof rent === 'number') return [Math.floor(rent)];
  if (!rent || rent === 'NA') return [];
  
  const str = String(rent);
  // Find all numbers in the string, handling commas
  const matches = str.match(/\d{1,3}(,\d{3})*/g);
  
  if (!matches) return [];
  
  return matches
    .map(m => parseInt(m.replace(/,/g, ''), 10))
    .filter(p => !isNaN(p) && p > 0);
};

/**
 * Parses a distance matrix string into an array of DistanceMatrixItem.
 * Normalizes 'km' into 'meters' (1km = 1000m).
 */
export const parseDistanceMatrix = (data: string): DistanceMatrixItem[] => {
  if (!data || data === 'NA') return [];
  
  const lines = data.split(/[\n,;]/).map(l => l.trim()).filter(l => l !== '');
  const results: DistanceMatrixItem[] = [];

  for (const line of lines) {
    const regex = /^(.*?)(?:\s*[-:]\s*|\s+)(\d+(?:\.\d+)?)\s*(m|km|meter|kilometer)?$/i;
    const match = line.match(regex);

    if (match) {
      const name = match[1].trim();
      const value = parseFloat(match[2]);
      const unitRaw = (match[3] || 'm').toLowerCase();

      let distance = value;
      if (unitRaw.startsWith('k')) {
        distance = value * 1000;
      }

      if (!isNaN(distance)) {
        results.push({ name, distance, unit: 'm' });
      }
    }
  }
  
  return results;
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
 * Standardizes area names using fuzzy matching logic.
 */
export const standardizeArea = (area: string, masterAreas: string[]): string => {
  if (!area) return '';
  const normalized = area.trim().toUpperCase();
  
  // Direct match
  const directMatch = masterAreas.find(a => a.toUpperCase() === normalized);
  if (directMatch) return directMatch;
  
  // Fuzzy match: check if normalized area contains or is contained by any master area
  const partialMatch = masterAreas.find(a => {
    const masterNorm = a.toUpperCase();
    return normalized.includes(masterNorm) || masterNorm.includes(normalized);
  });
  
  return partialMatch || area;
};

/**
 * Generates a unique composite key for a property.
 */
export const generatePropertyKey = (phone: string, name: string): string => {
  const cleanP = normalizePhone(phone);
  const cleanN = name.toLowerCase().replace(/\s+/g, '');
  return `${cleanP}_${cleanN}`;
};

/**
 * Formats a number as a currency string for display.
 * Example: 12000 -> "12,000/-"
 */
export const formatRentDisplay = (rent: number): string => {
  return `${rent.toLocaleString('en-IN')}/-`;
};

/**
 * Geocodes a Plus Code into Latitude and Longitude.
 * In a real production environment, this would call the Google Maps Geocoding API.
 * For this implementation, we provide a robust placeholder that simulates the behavior.
 */
export const geocodePlusCode = async (plusCode: string): Promise<{ lat: number; lng: number } | null> => {
  if (!plusCode || plusCode === 'NA') return null;

  // Kota, Rajasthan coordinates as a base for simulation
  const KOTA_LAT = 25.18;
  const KOTA_LNG = 75.83;

  // Simple simulation: Generate stable but random-looking coordinates based on the plus code string
  // This ensures the same Plus Code always results in the same Lat/Lng for the demo
  let hash = 0;
  for (let i = 0; i < plusCode.length; i++) {
    hash = plusCode.charCodeAt(i) + ((hash << 5) - hash);
  }

  const latOffset = (hash % 100) / 1000;
  const lngOffset = ((hash >> 8) % 100) / 1000;

  return {
    lat: KOTA_LAT + latOffset,
    lng: KOTA_LNG + lngOffset
  };
};
