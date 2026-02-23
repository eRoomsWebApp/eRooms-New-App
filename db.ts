
import { Property, ListingType, Gender, ApprovalStatus, User, UserRole, UserStatus, AppConfig } from './types';
import { KOTA_AREAS, INSTITUTES, FACILITY_OPTIONS } from './constants';

const STORAGE_KEY = 'erooms_atlas_v3_cluster';
const USERS_STORAGE_KEY = 'erooms_atlas_users';
const CONFIG_STORAGE_KEY = 'erooms_atlas_config';

export const CONFIG_UPDATED_EVENT = 'erooms_config_sync';

export const DEFAULT_CONFIG: AppConfig = {
  siteName: 'erooms.in',
  tagline: 'Premium Kota Student Living',
  heroDescription: 'Discover 10+ elite verified properties across Kota. Zero-commission direct bookings.',
  footerText: "Kota's largest student housing network. Hosted for free on Vercel. Database via Atlas.",
  maintenanceMode: false,
  allowNewRegistrations: true,
  supportWhatsApp: '919876543210',
  supportPhone: '+91 98765-43210',
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

// --- DATA INTEGRITY SHIELD ---
const normalizeProperty = (p: any): Property => ({
  id: p.id || `node-${Math.random().toString(36).substr(2, 5)}`,
  ownerId: p.ownerId || 'system-auto',
  ListingName: p.ListingName || 'Unlabeled Asset',
  ListingType: p.ListingType || ListingType.Hostel,
  Gender: p.Gender || Gender.Boys,
  OwnerName: p.OwnerName || 'Unknown Host',
  OwnerWhatsApp: p.OwnerWhatsApp || '0000000000',
  WardenName: p.WardenName || 'On-Call Security',
  EmergencyContact: p.EmergencyContact || '911',
  OwnerEmail: p.OwnerEmail || 'contact@erooms.in',
  Area: p.Area || KOTA_AREAS[0],
  FullAddress: p.FullAddress || 'Address Pending',
  GoogleMapsPlusCode: p.GoogleMapsPlusCode || 'N/A',
  InstituteDistanceMatrix: Array.isArray(p.InstituteDistanceMatrix) ? p.InstituteDistanceMatrix : INSTITUTES.map(name => ({ name, distance: 0.5 + Math.random() })),
  RentSingle: Number(p.RentSingle) || 12000,
  RentDouble: Number(p.RentDouble) || 10500,
  SecurityTerms: p.SecurityTerms || 'Terms pending review.',
  ElectricityCharges: Number(p.ElectricityCharges) || 10,
  Maintenance: Number(p.Maintenance) || 1000,
  ParentsStayCharge: Number(p.ParentsStayCharge) || 500,
  Facilities: Array.isArray(p.Facilities) ? p.Facilities : ['AC', 'WiFi', 'Mess Facility', 'RO Water', 'Laundry'],
  PhotoMain: p.PhotoMain || 'https://images.unsplash.com/photo-1512917774-50ad913ee29a?auto=format&fit=crop&q=80&w=2000',
  PhotoRoom: p.PhotoRoom || 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&q=80&w=2000',
  PhotoWashroom: p.PhotoWashroom || 'https://images.unsplash.com/photo-1584622650-61f8c508fe54?auto=format&fit=crop&q=80&w=2000',
  ApprovalStatus: p.ApprovalStatus || ApprovalStatus.Pending
});

export const fetchProperties = async (): Promise<Property[]> => {
  await new Promise(r => setTimeout(r, 100)); // Simulating network latency
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initial = generateInitialProperties();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const data = JSON.parse(stored);
    return data.map(normalizeProperty);
  } catch {
    return [];
  }
};

export const syncProperties = async (properties: Property[]): Promise<void> => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
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
