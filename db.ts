
import { Property, ListingType, Gender, ApprovalStatus, User, UserRole, UserStatus, AppConfig } from './types';
import { KOTA_AREAS, INSTITUTES, FACILITY_OPTIONS } from './constants';

const STORAGE_KEY = 'erooms_properties_v2';
const USERS_STORAGE_KEY = 'erooms_registered_users';
const CONFIG_STORAGE_KEY = 'erooms_global_config';

// Custom event for real-time config syncing
export const CONFIG_UPDATED_EVENT = 'erooms_config_updated';

export const DEFAULT_CONFIG: AppConfig = {
  siteName: 'erooms.in',
  tagline: 'Stay Close to Your Future',
  heroDescription: 'Discover elite hostels and PGs curated for the modern scholar. Search by your coaching or desired locality.',
  footerText: "Kota's high-fidelity discovery engine for the modern student athlete and scholar.",
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
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify({
    ...config,
    lastUpdated: new Date().toISOString()
  }));
  // Broadcast the change instantly
  window.dispatchEvent(new CustomEvent(CONFIG_UPDATED_EVENT, { detail: config }));
};

export const MOCK_USERS: User[] = [
  {
    id: 'owner-vikram',
    username: 'Vikram Singh',
    email: 'vikram@rajresidency.com',
    phone: '+91 98765 43210',
    role: UserRole.Owner,
    status: UserStatus.Active,
    joinedAt: '2023-05-12T10:30:00.000Z',
    address: 'Sector B, Landmark City, Kunadi, Kota',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram'
  },
  {
    id: 'owner-meera',
    username: 'Meera Reddy',
    email: 'meera@garginiwas.com',
    phone: '+91 88223 34455',
    role: UserRole.Owner,
    status: UserStatus.Active,
    joinedAt: '2023-08-20T14:15:00.000Z',
    address: 'Talwandi, Near Commerce College, Kota',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Meera'
  },
  {
    id: 'student-aarav',
    username: 'Aarav Mehta',
    email: 'aarav.m@gmail.com',
    phone: '+91 77112 23344',
    role: UserRole.Student,
    status: UserStatus.Active,
    joinedAt: '2024-01-05T09:00:00.000Z',
    address: 'Room 204, Raj Residency, Kota',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aarav',
    behavioralMetrics: {
      avgSessionTime: 12.5,
      totalSessions: 42,
      pricePreference: { min: 12000, max: 16000 },
      topAreas: ['Landmark City', 'Coral Park'],
      topFacilities: ['AC', 'WiFi', 'Gym'],
      searchDepth: 8
    },
    activityLog: [
      { id: 'l1', action: 'Dossier Inquiry', target: 'Raj Residency Elite', timestamp: '2024-03-20T14:30:00Z', importance: 'high' },
      { id: 'l2', action: 'Filter Applied', target: 'Rent < 15k', timestamp: '2024-03-20T14:25:00Z', importance: 'low' },
      { id: 'l3', action: 'VR Tour Started', target: 'Elite Suite Room', timestamp: '2024-03-19T10:00:00Z', importance: 'medium' },
      { id: 'l4', action: 'Portal Access', target: 'iPhone 15 Pro', timestamp: '2024-03-18T18:45:00Z', importance: 'low' },
      { id: 'l5', action: 'WhatsApp Contact', target: 'Vikram Singh (Owner)', timestamp: '2024-03-15T12:00:00Z', importance: 'high' }
    ]
  },
  {
    id: 'student-ishita',
    username: 'Ishita Sharma',
    email: 'ishita.s@outlook.com',
    phone: '+91 99008 87766',
    role: UserRole.Student,
    status: UserStatus.Active,
    joinedAt: '2024-02-15T11:45:00.000Z',
    address: 'Gargi Kanya Niwas, Talwandi, Kota',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ishita',
    behavioralMetrics: {
      avgSessionTime: 8.2,
      totalSessions: 18,
      pricePreference: { min: 8000, max: 12000 },
      topAreas: ['Talwandi', 'Jawahar Nagar'],
      topFacilities: ['Mess', 'Laundry', 'Security'],
      searchDepth: 5
    },
    activityLog: [
      { id: 'l6', action: 'Session Started', target: 'Talwandi Search', timestamp: '2024-03-21T09:15:00Z', importance: 'low' },
      { id: 'l7', action: 'Asset Bookmark', target: 'Gargi Kanya Niwas', timestamp: '2024-03-21T09:10:00Z', importance: 'medium' },
      { id: 'l8', action: 'Gallery Explored', target: 'Washroom Hygiene', timestamp: '2024-03-20T11:20:00Z', importance: 'low' },
      { id: 'l9', action: 'Emergency Sync', target: 'Warden Mamta Devi', timestamp: '2024-03-18T15:40:00Z', importance: 'medium' }
    ]
  }
];

export const MOCK_PROPERTIES: Property[] = [
  {
    id: 'p1',
    ownerId: 'owner-vikram',
    ListingName: 'Raj Residency Elite',
    ListingType: ListingType.Hostel,
    Gender: Gender.Boys,
    OwnerName: 'Vikram Singh',
    OwnerWhatsApp: '919876543210',
    WardenName: 'Suresh Kumar',
    EmergencyContact: '919876543211',
    OwnerEmail: 'vikram@rajresidency.com',
    Area: 'Landmark City (Kunadi)',
    FullAddress: 'Plot 42, Sector B, Landmark City, Kunadi, Kota',
    GoogleMapsPlusCode: '5RW3+PQ Kota',
    InstituteDistanceMatrix: [
      { name: 'Allen Samyak', distance: 0.3 },
      { name: 'Allen Sangyan', distance: 0.8 }
    ],
    RentSingle: 18000,
    RentDouble: 14500,
    SecurityTerms: 'One month rent as security deposit, refundable on 1 month notice.',
    ElectricityCharges: 12,
    Maintenance: 2000,
    ParentsStayCharge: 500,
    Facilities: ['AC', 'WiFi', 'Mess Facility', 'Laundry', 'CCTV', 'RO Water', 'Study Table'],
    PhotoMain: 'https://images.unsplash.com/photo-1555854817-5b2260d07c47?q=80&w=2070&auto=format&fit=crop',
    PhotoRoom: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=2071&auto=format&fit=crop',
    PhotoWashroom: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop',
    ApprovalStatus: ApprovalStatus.Approved
  },
  {
    id: 'p2',
    ownerId: 'owner-meera',
    ListingName: 'Gargi Kanya Niwas',
    ListingType: ListingType.Hostel,
    Gender: Gender.Girls,
    OwnerName: 'Meera Reddy',
    OwnerWhatsApp: '918822334455',
    WardenName: 'Mamta Devi',
    EmergencyContact: '918822334456',
    OwnerEmail: 'meera@garginiwas.com',
    Area: 'Talwandi',
    FullAddress: '15-A, Talwandi, Near Commerce College, Kota',
    GoogleMapsPlusCode: '4R7V+X8 Kota',
    InstituteDistanceMatrix: [
      { name: 'Resonance', distance: 0.4 },
      { name: 'Motion', distance: 1.2 }
    ],
    RentSingle: 15000,
    RentDouble: 11000,
    SecurityTerms: '5000 fixed security deposit, non-refundable if left within 3 months.',
    ElectricityCharges: 10,
    Maintenance: 1500,
    ParentsStayCharge: 400,
    Facilities: ['AC', 'WiFi', 'Mess Facility', 'Laundry', 'CCTV', 'Attached Washroom', 'Biometric Entry'],
    PhotoMain: 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=2070&auto=format&fit=crop',
    PhotoRoom: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?q=80&w=2070&auto=format&fit=crop',
    PhotoWashroom: 'https://images.unsplash.com/photo-1620626011761-9963d7b69763?q=80&w=2070&auto=format&fit=crop',
    ApprovalStatus: ApprovalStatus.Approved
  }
];

export const getProperties = (): Property[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_PROPERTIES));
    return MOCK_PROPERTIES;
  }
  try {
    return JSON.parse(stored);
  } catch {
    return MOCK_PROPERTIES;
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
