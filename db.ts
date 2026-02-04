
import { Property, ListingType, Gender, ApprovalStatus, User, UserRole, UserStatus, AppConfig } from './types';
import { KOTA_AREAS, INSTITUTES, FACILITY_OPTIONS } from './constants';

const STORAGE_KEY = 'erooms_mongodb_atlas_v2';
const USERS_STORAGE_KEY = 'erooms_atlas_users';
const CONFIG_STORAGE_KEY = 'erooms_atlas_config';

export const CONFIG_UPDATED_EVENT = 'erooms_config_sync';

export const DEFAULT_CONFIG: AppConfig = {
  siteName: 'erooms.in',
  tagline: 'Premium Kota Student Living',
  heroDescription: 'Discover 10+ elite verified properties across Kota. Zero-commission direct bookings.',
  footerText: "Kota's largest student housing network. Hosted for free. Managed with precision.",
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

// --- DATA NORMALIZATION ENGINE ---
const normalizeProperty = (p: any): Property => ({
  ...p,
  InstituteDistanceMatrix: p.InstituteDistanceMatrix || INSTITUTES.map(name => ({ name, distance: 1.0 })),
  Facilities: p.Facilities || [],
  RentSingle: Number(p.RentSingle) || 0,
  RentDouble: Number(p.RentDouble) || 0,
  ElectricityCharges: Number(p.ElectricityCharges) || 0,
  Maintenance: Number(p.Maintenance) || 0,
  ParentsStayCharge: Number(p.ParentsStayCharge) || 0,
  ApprovalStatus: p.ApprovalStatus || ApprovalStatus.Pending
});

// --- REFINED MOCK GENERATOR (10 ELITE ASSETS) ---
const generateInitialProperties = (): Property[] => {
  const imgSeeds = [
    { main: '1555854817-7e6d836ddf12', room: '1522771739-93a05281a0ff', wash: '1584622650-61f8c508fe54' },
    { main: '1582719508411-9f2f5cbe2621', room: '1598928506311-c55ded91a20c', wash: '1503387762-28b0ac42d38b' },
    { main: '1600585154340-be6161a56a0c', room: '1616594110041-91b9f9cc7422', wash: '1552321554-5befe7c02b63' },
    { main: '1512917774-50ad913ee29a', room: '1560448204-61c9c730834b', wash: '1564013799-a363690d9841' },
    { main: '1448630366172-dfc41447e895', room: '1513694203600-c25f778600c2', wash: '1620626011706-6a83125c9ed3' },
    { main: '1623350290312-d75d2d098198', room: '1595526116539-7484b9f1873b', wash: '1585412727339-10640f096265' },
    { main: '1570129476835-83cb2118930a', room: '1540518614-b844594c2c39', wash: '1507089947368-19c1ac964534' },
    { main: '1502672260266-1c1ef2d93688', room: '1618220176303-125656641c28', wash: '1631049307264-da039a3b054a' },
    { main: '1564013799-97b744044c8b', room: '1598928639108-fb0c9d740520', wash: '1507089947368-19c1ac964534' },
    { main: '1600607689528-c9f1a0937896', room: '1554998171-8941a3003057', wash: '1584622650-61f8c508fe54' }
  ];

  return Array.from({ length: 10 }).map((_, i) => normalizeProperty({
    id: `p-${i + 1}`,
    ownerId: i % 2 === 0 ? 'owner-vikram' : 'owner-meera',
    ListingName: `${['Aryan', 'Zenith', 'Elite', 'Oasis', 'Krishna', 'Radiant', 'Sigma', 'Prism', 'Aura', 'Summit'][i]} ${i % 3 === 0 ? 'Hostel' : 'PG'}`,
    ListingType: i % 3 === 0 ? ListingType.Hostel : ListingType.PG,
    Gender: i % 2 === 0 ? Gender.Boys : Gender.Girls,
    OwnerName: i % 2 === 0 ? 'Vikram Singh' : 'Meera Reddy',
    OwnerWhatsApp: `91987650000${i}`,
    WardenName: i % 2 === 0 ? 'Suresh Kumar' : 'Mamta Devi',
    EmergencyContact: `91987654321${i}`,
    OwnerEmail: i % 2 === 0 ? 'vikram@erooms.in' : 'meera@erooms.in',
    Area: KOTA_AREAS[i % KOTA_AREAS.length],
    FullAddress: `Property Node ${101 + i}, Sector ${String.fromCharCode(65 + (i % 5))}, Kota`,
    GoogleMapsPlusCode: `5RW3+PQ Kota`,
    InstituteDistanceMatrix: INSTITUTES.map((inst, idx) => ({ name: inst, distance: parseFloat((0.2 + (idx * 0.4)).toFixed(1)) })),
    RentSingle: 14500 + (i * 500),
    RentDouble: 10500 + (i * 300),
    SecurityTerms: 'Security equal to 1 month rent. Refundable.',
    ElectricityCharges: 11,
    Maintenance: 1500,
    ParentsStayCharge: 400,
    Facilities: FACILITY_OPTIONS.slice(0, 6),
    PhotoMain: `https://images.unsplash.com/photo-${imgSeeds[i].main}?auto=format&fit=crop&q=80&w=2000`,
    PhotoRoom: `https://images.unsplash.com/photo-${imgSeeds[i].room}?auto=format&fit=crop&q=80&w=2000`,
    PhotoWashroom: `https://images.unsplash.com/photo-${imgSeeds[i].wash}?auto=format&fit=crop&q=80&w=2000`,
    ApprovalStatus: ApprovalStatus.Approved
  }));
};

export const getProperties = (): Property[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initial = generateInitialProperties();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(stored).map(normalizeProperty);
};

export const saveProperties = (properties: Property[]) => {
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

export const getMockUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};
