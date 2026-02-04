
import { Property, ListingType, Gender, ApprovalStatus, User, UserRole, UserStatus, AppConfig, ActivityLog } from './types';
import { KOTA_AREAS, INSTITUTES, FACILITY_OPTIONS } from './constants';

const STORAGE_KEY = 'erooms_properties_v2';
const USERS_STORAGE_KEY = 'erooms_registered_users';
const CONFIG_STORAGE_KEY = 'erooms_global_config';

export const CONFIG_UPDATED_EVENT = 'erooms_config_updated';

export const DEFAULT_CONFIG: AppConfig = {
  siteName: 'erooms.in',
  tagline: 'Future of Kota Student Living',
  heroDescription: 'Discover 500+ verified properties across Kota. Search by coaching, area, or budget.',
  footerText: "Kota's largest student housing network. Engineered for the modern scholar.",
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

// --- CORE PERSISTENCE ENGINE ---

export const getAppConfig = (): AppConfig => {
  const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
    return DEFAULT_CONFIG;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return DEFAULT_CONFIG;
  }
};

export const saveAppConfig = (config: AppConfig) => {
  const updatedConfig = {
    ...config,
    lastUpdated: new Date().toISOString()
  };
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(updatedConfig));
  window.dispatchEvent(new CustomEvent(CONFIG_UPDATED_EVENT, { detail: updatedConfig }));
};

// --- MOCK GENERATOR ---

const generateInitialProperties = (count: number): Property[] => {
  const props: Property[] = [];
  for (let i = 1; i <= count; i++) {
    const area = KOTA_AREAS[i % KOTA_AREAS.length];
    const type = i % 10 === 0 ? ListingType.Flat : i % 8 === 0 ? ListingType.PG : ListingType.Hostel;
    const gender = i % 3 === 0 ? Gender.Girls : i % 5 === 0 ? Gender.Unisex : Gender.Boys;
    const baseRent = 8000 + Math.floor(Math.random() * 15000);
    
    props.push({
      id: `p-${i}`,
      ownerId: i % 2 === 0 ? 'owner-vikram' : 'owner-meera',
      ListingName: `${['Shree', 'Elite', 'Royal', 'Oasis', 'Krishna'][i % 5]} ${['Residency', 'Hostel', 'Niwas'][i % 3]} ${i}`,
      ListingType: type,
      Gender: gender,
      OwnerName: i % 2 === 0 ? 'Vikram Singh' : 'Meera Reddy',
      OwnerWhatsApp: `91${9876500000 + i}`,
      WardenName: i % 2 === 0 ? 'Suresh Kumar' : 'Mamta Devi',
      EmergencyContact: `91${9876543200 + i}`,
      OwnerEmail: i % 2 === 0 ? 'vikram@rajresidency.com' : 'meera@garginiwas.com',
      Area: area,
      FullAddress: `Plot ${100 + i}, Sector ${String.fromCharCode(65 + (i % 5))}, ${area}, Kota`,
      GoogleMapsPlusCode: `${5 + (i % 5)}RW3+PQ Kota`,
      InstituteDistanceMatrix: INSTITUTES.map(inst => ({
        name: inst,
        distance: parseFloat((0.2 + Math.random() * 2).toFixed(1))
      })),
      RentSingle: baseRent + 4000,
      RentDouble: baseRent,
      SecurityTerms: 'Refundable security deposit of one month rent required.',
      ElectricityCharges: 10 + (i % 5),
      Maintenance: 1000 + (i % 1000),
      ParentsStayCharge: 300 + (i % 500),
      Facilities: FACILITY_OPTIONS.filter((_, idx) => (i + idx) % 3 === 0),
      PhotoMain: `https://images.unsplash.com/photo-${1555854817 + i}?q=80&w=2070&auto=format&fit=crop`,
      PhotoRoom: `https://images.unsplash.com/photo-${1522771739 + i}?q=80&w=2071&auto=format&fit=crop`,
      PhotoWashroom: `https://images.unsplash.com/photo-${1584622650 + i}?q=80&w=2070&auto=format&fit=crop`,
      ApprovalStatus: i < 5 ? ApprovalStatus.Pending : ApprovalStatus.Approved
    });
  }
  return props;
};

export const MOCK_USERS: User[] = [
  {
    id: 'student-aarav',
    username: 'Aarav Mehta',
    email: 'aarav.m@gmail.com',
    role: UserRole.Student,
    status: UserStatus.Active,
    joinedAt: '2024-01-05T09:00:00.000Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav',
    behavioralMetrics: {
      avgSessionTime: 12.5,
      totalSessions: 42,
      pricePreference: { min: 12000, max: 18000 },
      topAreas: ['Landmark City (Kunadi)', 'Coral Park'],
      topFacilities: ['AC', 'WiFi', 'Mess Facility'],
      searchDepth: 8
    },
    activityLog: [
      { id: '1', action: 'Asset Discovery', target: 'Shree Residency 1', timestamp: new Date().toISOString(), importance: 'low' },
      { id: '2', action: 'Direct Transmit', target: 'Owner Contacted', timestamp: new Date(Date.now() - 3600000).toISOString(), importance: 'high' },
      { id: '3', action: 'Cluster Pivot', target: 'Landmark City', timestamp: new Date(Date.now() - 7200000).toISOString(), importance: 'medium' }
    ]
  },
  {
    id: 'owner-vikram',
    username: 'Vikram Singh',
    email: 'vikram@rajresidency.com',
    role: UserRole.Owner,
    status: UserStatus.Active,
    joinedAt: '2023-05-12T10:30:00.000Z',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram'
  }
];

export const getProperties = (): Property[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initial = generateInitialProperties(50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return [];
  }
};

export const saveProperties = (properties: Property[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
};

export const getMockUsers = (): User[] => {
  const stored = localStorage.getItem(USERS_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(MOCK_USERS));
    return MOCK_USERS;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return MOCK_USERS;
  }
};

export const saveUsers = (users: User[]) => {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
};
