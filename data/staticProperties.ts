import { Property } from '../types';
import hostelsData from './hostels.json';

/**
 * Static hostel catalogue generated from the "eRooms Hostels MASTER" Google Sheet.
 * Public fields only (no owner / warden names or phone numbers).
 * Loaded from the bundle, so the public listing needs zero Firebase reads.
 * Regenerate data/hostels.json + public/media/* with the eRooms sync process ("sync karo").
 */
export const STATIC_PROPERTIES: Property[] = hostelsData as unknown as Property[];

export const STATIC_PROPERTY_IDS = new Set(STATIC_PROPERTIES.map((p) => p.id));
