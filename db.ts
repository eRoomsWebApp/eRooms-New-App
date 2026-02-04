
import { Property, ListingType, Gender, ApprovalStatus, User, UserRole, UserStatus, AppConfig, ActivityLog } from './types';
import { KOTA_AREAS, INSTITUTES, FACILITY_OPTIONS } from './constants';

const STORAGE_KEY = 'erooms_properties_v2';
const USERS_STORAGE_KEY = 'erooms_registered_users';
const CONFIG_STORAGE_KEY = 'erooms_global_config';

export const CONFIG_UPDATED_EVENT = 'erooms_config_updated';

export const DEFAULT_CONFIG: AppConfig = {
  siteName: 'erooms.in',
  tagline: 'Future of Kota Student Living',
  heroDescription: 'Discover 10+ elite verified properties across Kota. Search by coaching, area, or budget.',
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

// --- MOCK GENERATOR (REFINED TO 10 ELITE PROPERTIES) ---

const generateInitialProperties = (count: number): Property[] => {
  const props: Property[] = [];
  
  // High-quality imagery seeds
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

  for (let i = 0; i < count; i++) {
    const area = KOTA_AREAS[i % KOTA_AREAS.length];
    const type = i % 4 === 0 ? ListingType.PG : ListingType.Hostel;
    const gender = i % 2 === 0 ? Gender.Boys : Gender.Girls;
    const baseRent = 9500 + Math.floor(Math.random() * 8000);
    const seed = imgSeeds[i];
    
    props.push({
      id: `p-${i + 1}`,
      ownerId: i % 2 === 0 ? 'owner-vikram' : 'owner-meera',
      ListingName: `${['Aryan', 'Zenith', 'Elite', 'Oasis', 'Krishna', 'Radiant', 'Sigma', 'Prism', 'Aura', 'Summit'][i]} ${type}`,
      ListingType: type,
      Gender: gender,
      OwnerName: i % 2 === 0 ? 'Vikram Singh' : 'Meera Reddy',
      OwnerWhatsApp: `91${9876500000 + i}`,
      WardenName: i % 2 === 0 ? 'Suresh Kumar' : 'Mamta Devi',
      EmergencyContact: `91${9876543200 + i}`,
      OwnerEmail: i % 2 === 0 ? 'vikram@erooms.in' : 'meera@erooms.in',
      Area: area,
      FullAddress: `Asset Node ${101 + i}, Sector ${String.fromCharCode(65 + (i % 5))}, ${area}, Kota`,
      GoogleMapsPlusCode: `${5 + (i % 5)}RW3+PQ Kota`,
      InstituteDistanceMatrix: INSTITUTES.map((inst, idx) => ({
        name: inst,
        distance: parseFloat((0.1 + (idx * 0.3)).toFixed(1))
      })),
      RentSingle: baseRent + 5000,
      RentDouble: baseRent,
      SecurityTerms: 'Security equal to 1 month rent. Refundable on checkout.',
      ElectricityCharges: 11,
      Maintenance: 1500,
      ParentsStayCharge: 400,
      Facilities: FACILITY_OPTIONS.filter((_, idx) => (i + idx) % 2 === 0 || idx < 4),
      PhotoMain: `https://images.unsplash.com/photo-${seed.main}?q=80&w=2070&auto=format&fit=crop`,
      PhotoRoom: `https://images.unsplash.com/photo-${seed.room}?q=80&w=2071&auto=format&fit=crop`,
      PhotoWashroom: `https://images.unsplash.com/photo-${seed.wash}?q=80&w=2070&auto=format&fit=crop`,
      ApprovalStatus: ApprovalStatus.Approved
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
      { id: '1', action: 'Asset Discovery', target: 'Aryan Hostel', timestamp: new Date().toISOString(), importance: 'low' },
      { id: '2', action: 'Direct Transmit', target: 'Owner Contacted', timestamp: new Date(Date.now() - 3600000).toISOString(), importance: 'high' }
    ]
  }
];

export const getProperties = (): Property[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const initial = generateInitialProperties(10);
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
