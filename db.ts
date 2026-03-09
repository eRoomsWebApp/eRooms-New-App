
import { Property, ListingType, Gender, ApprovalStatus, User, AppConfig, Lead } from './types';
import { KOTA_AREAS, INSTITUTES, FACILITY_OPTIONS } from './constants';
import { normalizePhone, parseRent } from './utils/normalization';
import { transformDriveUrl } from './utils/urlHelper';

const STORAGE_KEY = 'erooms_atlas_v3_cluster';
const BACKUP_KEY = 'erooms_atlas_v3_cluster_backup';
const USERS_STORAGE_KEY = 'erooms_atlas_users';
const CONFIG_STORAGE_KEY = 'erooms_atlas_config';
const LEADS_STORAGE_KEY = 'erooms_atlas_leads';
const DRAFT_PROPERTY_KEY = 'erooms_atlas_property_draft';

export const CONFIG_UPDATED_EVENT = 'erooms_config_sync';

// --- DRAFT MANAGEMENT ---
export const savePropertyDraft = (data: Partial<Property>) => {
  localStorage.setItem(DRAFT_PROPERTY_KEY, JSON.stringify(data));
};

export const getPropertyDraft = (): Partial<Property> | null => {
  const stored = localStorage.getItem(DRAFT_PROPERTY_KEY);
  try {
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export const clearPropertyDraft = () => {
  localStorage.removeItem(DRAFT_PROPERTY_KEY);
};

export const DEFAULT_CONFIG: AppConfig = {
  siteName: 'erooms.in',
  tagline: 'Premium Kota Student Living',
  heroDescription: 'Discover 10+ elite verified properties across Kota. Zero-commission direct bookings.',
  footerText: "Kota's largest student housing network. Hosted for free on Vercel. Database via Atlas.",
  maintenanceMode: false,
  allowNewRegistrations: true,
  supportWhatsApp: '919351099947',
  supportPhone: '+91 93510-99947',
  supportEmail: 'support@erooms.in',
  socialLinks: {
    instagram: 'https://instagram.com/erooms',
    twitter: 'https://twitter.com/erooms',
    linkedin: 'https://linkedin.com/company/erooms'
  },
  areas: KOTA_AREAS,
  institutes: INSTITUTES,
  facilities: FACILITY_OPTIONS,
  lastUpdated: new Date().toISOString()
};

// --- LEADS MANAGEMENT ---
export const fetchLeads = (): Lead[] => {
  const stored = localStorage.getItem(LEADS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveLead = (lead: Omit<Lead, 'id' | 'timestamp' | 'status'>) => {
  const leads = fetchLeads();
  const newLead: Lead = {
    ...lead,
    id: `lead-${Date.now()}`,
    timestamp: new Date().toISOString(),
    status: 'New'
  };
  leads.push(newLead);
  localStorage.setItem(LEADS_STORAGE_KEY, JSON.stringify(leads));
  
  // Update property lead count
  const properties: Property[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const propIndex = properties.findIndex((p: Property) => p.id === lead.propertyId);
  if (propIndex !== -1) {
    properties[propIndex].leadsCount = (properties[propIndex].leadsCount || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
  }
  
  return newLead;
};

export const recordPropertyView = (propertyId: string) => {
  const properties: Property[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  const propIndex = properties.findIndex((p: Property) => p.id === propertyId);
  if (propIndex !== -1) {
    properties[propIndex].views = (properties[propIndex].views || 0) + 1;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
  }
};

// --- DATA INTEGRITY SHIELD ---
const normalizeProperty = (p: Record<string, unknown>): Property => ({
  id: (p.id as string) || `node-${Math.random().toString(36).substr(2, 5)}`,
  ownerId: (p.ownerId as string) || 'system-auto',
  ListingName: (p.ListingName as string) || 'Unlabeled Asset',
  ListingType: (p.ListingType as ListingType) || ListingType.Hostel,
  Gender: (p.Gender as Gender) || Gender.Boys,
  OwnerName: (p.OwnerName as string) || 'Unknown Host',
  OwnerWhatsApp: normalizePhone((p.OwnerWhatsApp as string) || '919351099947'),
  WardenName: (p.WardenName as string) || 'On-Call Security',
  EmergencyContact: normalizePhone((p.EmergencyContact as string) || '911'),
  OwnerEmail: (p.OwnerEmail as string) || 'contact@erooms.in',
  Area: (p.Area as string) || KOTA_AREAS[0],
  FullAddress: (p.FullAddress as string) || 'Address Pending',
  GoogleMapsPlusCode: (p.GoogleMapsPlusCode as string) || 'N/A',
  InstituteDistanceMatrix: Array.isArray(p.InstituteDistanceMatrix) ? (p.InstituteDistanceMatrix as { name: string; distance: number }[]) : INSTITUTES.map(name => ({ name, distance: 0.5 + Math.random() })),
  RentSingle: parseRent(p.RentSingle),
  RentDouble: parseRent(p.RentDouble),
  SecurityTerms: (p.SecurityTerms as string) || 'Terms pending review.',
  ElectricityCharges: Number(p.ElectricityCharges) || 10,
  Maintenance: Number(p.Maintenance) || 1000,
  ParentsStayCharge: Number(p.ParentsStayCharge) || 500,
  Facilities: Array.isArray(p.Facilities) ? (p.Facilities as string[]) : ['AC', 'WiFi', 'Mess Facility', 'RO Water', 'Laundry'],
  PhotoMain: transformDriveUrl((p.PhotoMain as string) || 'https://images.unsplash.com/photo-1512917774-50ad913ee29a?auto=format&fit=crop&q=80&w=2000'),
  PhotoRoom: transformDriveUrl((p.PhotoRoom as string) || 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=2000'),
  PhotoWashroom: transformDriveUrl((p.PhotoWashroom || 'https://images.unsplash.com/photo-1584622650-61f8c508fe54?auto=format&fit=crop&q=80&w=2000') as string),
  ApprovalStatus: (p.ApprovalStatus as ApprovalStatus) || ApprovalStatus.Pending
});

export const fetchProperties = async (): Promise<Property[]> => {
  await new Promise(r => setTimeout(r, 100)); // Simulating network latency
  
  let stored = localStorage.getItem(STORAGE_KEY);
  
  // If main storage is empty, try backup
  if (!stored) {
    stored = localStorage.getItem(BACKUP_KEY);
    if (stored) {
      console.log('Restored from backup');
      localStorage.setItem(STORAGE_KEY, stored);
    }
  }

  if (!stored) {
    const initial = generateInitialProperties();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    localStorage.setItem(BACKUP_KEY, JSON.stringify(initial));
    return initial;
  }

  try {
    const data = JSON.parse(stored);
    if (!Array.isArray(data)) throw new Error('Invalid data format');
    return data.map(normalizeProperty);
  } catch (err) {
    console.error('Data corruption detected, attempting recovery...', err);
    // Try backup as last resort
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup) {
      try {
        const backupData = JSON.parse(backup);
        return backupData.map(normalizeProperty);
      } catch {
        return [];
      }
    }
    return [];
  }
};

export const syncProperties = async (properties: Property[]): Promise<void> => {
  if (!properties || !Array.isArray(properties)) return;
  
  const data = JSON.stringify(properties);
  localStorage.setItem(STORAGE_KEY, data);
  
  // Also update backup if not empty
  if (properties.length > 0) {
    localStorage.setItem(BACKUP_KEY, data);
  }
};

export const getAppConfig = (): AppConfig => {
  const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
  return stored ? JSON.parse(stored) : DEFAULT_CONFIG;
};

export const saveAppConfig = (config: AppConfig) => {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
  window.dispatchEvent(new CustomEvent(CONFIG_UPDATED_EVENT, { detail: config }));
};

const generateInitialProperties = (): Property[] => {
  const eliteNames = [
    { name: 'Royal Zenith', area: KOTA_AREAS[0], price: 18500, type: ListingType.Hostel },
    { name: 'Elite Oasis', area: KOTA_AREAS[1], price: 16000, type: ListingType.Hostel },
    { name: 'Aura Premium', area: KOTA_AREAS[2], price: 14500, type: ListingType.PG },
    { name: 'Sigma Heights', area: KOTA_AREAS[3], price: 12500, type: ListingType.Hostel },
    { name: 'Radiant Living', area: KOTA_AREAS[4], price: 11000, type: ListingType.PG },
    { name: 'Prism Residency', area: KOTA_AREAS[0], price: 17000, type: ListingType.Hostel },
    { name: 'Summit Suites', area: KOTA_AREAS[1], price: 19500, type: ListingType.Hostel },
    { name: 'Krishna Classic', area: KOTA_AREAS[6], price: 9500, type: ListingType.PG },
    { name: 'Vedic Villa', area: KOTA_AREAS[5], price: 13000, type: ListingType.Flat },
    { name: 'Aaryans Den', area: KOTA_AREAS[0], price: 15500, type: ListingType.Hostel }
  ];

  return eliteNames.map((item, i) => normalizeProperty({
    id: `p-${i + 1}`,
    ownerId: 'emu-owner', // Linked to the emulated owner
    ListingName: item.name,
    RentDouble: item.price,
    RentSingle: item.price + 3000,
    Area: item.area,
    ListingType: item.type,
    ApprovalStatus: ApprovalStatus.Approved,
    Facilities: ['AC', 'WiFi', 'Mess Facility', 'Laundry', 'Biometric Entry', 'RO Water']
  }));
};

export const getMockUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};
