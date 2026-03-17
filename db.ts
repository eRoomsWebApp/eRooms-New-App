
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy,
  getDocFromServer,
  onSnapshot
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Property, ApprovalStatus, User, UserRole, UserStatus, AppConfig, Lead } from './types';
import { KOTA_AREAS, INSTITUTES, FACILITY_OPTIONS } from './constants';

export const CONFIG_UPDATED_EVENT = 'erooms_config_sync';

// --- ERROR HANDLING ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// --- CONNECTION TEST ---
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();

// --- APP CONFIG ---
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

export const getAppConfig = async (): Promise<AppConfig> => {
  const path = 'config/global';
  try {
    const docSnap = await getDoc(doc(db, path));
    return docSnap.exists() ? docSnap.data() as AppConfig : DEFAULT_CONFIG;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return DEFAULT_CONFIG;
  }
};

export const saveAppConfig = async (config: AppConfig) => {
  const path = 'config/global';
  try {
    await setDoc(doc(db, path), config);
    window.dispatchEvent(new CustomEvent(CONFIG_UPDATED_EVENT, { detail: config }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// --- LEADS ---
export const fetchLeads = async (userId: string, role: string): Promise<Lead[]> => {
  const path = 'leads';
  try {
    let q;
    if (role === 'admin') {
      q = query(collection(db, path), orderBy('timestamp', 'desc'));
    } else if (role === 'owner') {
      q = query(collection(db, path), orderBy('timestamp', 'desc'));
    } else {
      q = query(collection(db, path), where('studentId', '==', userId), orderBy('timestamp', 'desc'));
    }
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Lead);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const subscribeToLeads = (userId: string, role: string, callback: (leads: Lead[]) => void) => {
  const path = 'leads';
  let q;
  if (role === UserRole.Admin || role === UserRole.SuperAdmin) {
    q = query(collection(db, path), orderBy('timestamp', 'desc'));
  } else if (role === UserRole.Owner) {
    q = query(collection(db, path), orderBy('timestamp', 'desc'));
  } else {
    q = query(collection(db, path), where('studentId', '==', userId), orderBy('timestamp', 'desc'));
  }

  return onSnapshot(q, (snapshot) => {
    const leads = snapshot.docs.map(doc => doc.data() as Lead);
    callback(leads);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const saveLead = async (lead: Partial<Lead> & Omit<Lead, 'propertyId' | 'studentId' | 'propertyName' | 'studentName' | 'studentPhone' | 'type'>) => {
  const path = 'leads';
  const id = lead.id || `lead-${Date.now()}`;
  const newLead: Lead = {
    status: 'New',
    timestamp: new Date().toISOString(),
    ...lead,
    id,
  } as Lead;
  try {
    await setDoc(doc(db, path, id), newLead);
    
    // Increment property lead count
    const propPath = `properties/${lead.propertyId}`;
    const propSnap = await getDoc(doc(db, propPath));
    if (propSnap.exists()) {
      const currentLeads = propSnap.data().leadsCount || 0;
      await updateDoc(doc(db, propPath), { leadsCount: currentLeads + 1 });
    }

    await saveActivityLog({
      action: 'Inquiry Captured',
      importance: 'medium',
      target: lead.propertyName,
      metadata: { student: lead.studentName, type: lead.type }
    });
    
    return newLead;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
};

export const updateLead = async (leadId: string, updates: Partial<Lead>) => {
  const path = `leads/${leadId}`;
  try {
    await updateDoc(doc(db, 'leads', leadId), updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// --- PROPERTIES ---
export const recordPropertyView = async (propertyId: string) => {
  const path = `properties/${propertyId}`;
  try {
    const propSnap = await getDoc(doc(db, path));
    if (propSnap.exists()) {
      const currentViews = propSnap.data().views || 0;
      await updateDoc(doc(db, path), { views: currentViews + 1 });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const fetchProperties = async (): Promise<Property[]> => {
  const path = 'properties';
  try {
    const q = query(collection(db, path), where('ApprovalStatus', '==', ApprovalStatus.Approved));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as Property);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const fetchAllProperties = async (): Promise<Property[]> => {
  const path = 'properties';
  try {
    const querySnapshot = await getDocs(collection(db, path));
    return querySnapshot.docs.map(doc => doc.data() as Property);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const saveProperty = async (property: Property) => {
  const path = `properties/${property.id}`;
  try {
    const isNew = !(await getDoc(doc(db, 'properties', property.id))).exists();
    await setDoc(doc(db, 'properties', property.id), property);
    await saveActivityLog({
      action: isNew ? 'Property Registered' : 'Property Updated',
      importance: isNew ? 'medium' : 'low',
      target: property.ListingName,
      metadata: { id: property.id, area: property.Area }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteProperty = async (id: string) => {
  const path = `properties/${id}`;
  try {
    const propSnap = await getDoc(doc(db, 'properties', id));
    const propName = propSnap.exists() ? propSnap.data().ListingName : id;
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'properties', id));
    await saveActivityLog({
      action: 'Property Decommissioned',
      importance: 'high',
      target: propName,
      metadata: { id }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const subscribeToProperties = (
  userId: string | undefined,
  role: UserRole | undefined,
  callback: (properties: Property[]) => void
) => {
  const path = 'properties';
  let q;

  if (role === UserRole.Admin || role === UserRole.SuperAdmin) {
    // Admin sees everything
    q = query(collection(db, path), orderBy('ListingName', 'asc'));
  } else if (role === UserRole.Owner && userId) {
    // Owner sees their own properties + all approved properties (for context/comparison if needed, but usually just their own for management)
    // Actually, for the PropertyContext, we want to see ALL approved properties for the public view, 
    // AND the owner's own properties (even if pending) for the dashboard.
    // So we might need to fetch all approved OR owned by me.
    // Firestore doesn't support OR across different fields easily without multiple queries or in-memory filtering.
    // Let's just fetch all approved properties for everyone, and if owner, also fetch their own.
    // Or simpler: fetch all properties if admin/owner, and filter in context.
    // But for performance, let's just fetch all approved for now, and if owner, we'll need their pending ones too.
    
    // For now, let's fetch all properties for Admins and Owners, and only Approved for Students.
    q = query(collection(db, path), orderBy('ListingName', 'asc'));
  } else {
    // Students/Guests see only approved
    q = query(collection(db, path), where('ApprovalStatus', '==', ApprovalStatus.Approved), orderBy('ListingName', 'asc'));
  }

  return onSnapshot(q, (snapshot) => {
    const properties = snapshot.docs.map(doc => doc.data() as Property);
    callback(properties);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const bulkSaveProperties = async (properties: Property[]) => {
  // In a real app, use writeBatch
  const { writeBatch } = await import('firebase/firestore');
  const batch = writeBatch(db);
  properties.forEach(p => {
    const ref = doc(db, 'properties', p.id);
    batch.set(ref, p);
  });
  try {
    await batch.commit();
    await saveActivityLog({
      action: 'Bulk Asset Import',
      importance: 'high',
      target: 'System',
      metadata: { count: properties.length }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'properties/bulk');
  }
};

// --- USERS ---
export const fetchUser = async (userId: string): Promise<User | null> => {
  const path = `users/${userId}`;
  try {
    const docSnap = await getDoc(doc(db, path));
    return docSnap.exists() ? docSnap.data() as User : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const saveUser = async (user: User) => {
  const path = `users/${user.id}`;
  try {
    await setDoc(doc(db, 'users', user.id), user);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const updateUser = async (userId: string, updates: Partial<User>) => {
  const path = `users/${userId}`;
  try {
    const userSnap = await getDoc(doc(db, 'users', userId));
    const username = userSnap.exists() ? userSnap.data().username : userId;
    await updateDoc(doc(db, 'users', userId), updates);
    await saveActivityLog({
      action: 'Node Protocol Updated',
      importance: 'medium',
      target: username,
      metadata: { id: userId, updates: Object.keys(updates).join(', ') }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const subscribeToUsers = (callback: (users: User[]) => void) => {
  const path = 'users';
  const q = query(collection(db, path), orderBy('username', 'asc'));

  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => doc.data() as User);
    callback(users);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

// --- ACTIVITY LOGS ---
export const fetchActivityLogs = async (): Promise<ActivityLog[]> => {
  const path = 'activity_logs';
  try {
    const q = query(collection(db, path), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data() as ActivityLog);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const subscribeToActivityLogs = (callback: (logs: ActivityLog[]) => void) => {
  const path = 'activity_logs';
  const q = query(collection(db, path), orderBy('timestamp', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const logs = snapshot.docs.map(doc => doc.data() as ActivityLog);
    callback(logs);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const saveActivityLog = async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
  const path = 'activity_logs';
  const id = `log-${Date.now()}`;
  const newLog: ActivityLog = {
    ...log,
    id,
    timestamp: new Date().toISOString()
  };
  try {
    await setDoc(doc(db, path, id), newLog);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// --- DRAFTS ---
export const savePropertyDraft = (property: Partial<Property>) => {
  localStorage.setItem('erooms_property_draft', JSON.stringify(property));
};

export const getPropertyDraft = (): Partial<Property> | null => {
  const draft = localStorage.getItem('erooms_property_draft');
  return draft ? JSON.parse(draft) : null;
};

export const clearPropertyDraft = () => {
  localStorage.removeItem('erooms_property_draft');
};

export const getMockUsers = (): User[] => {
  return [
    {
      id: 'admin-1',
      username: 'Admin User',
      email: 'kajay5788@gmail.com',
      role: UserRole.Admin,
      status: UserStatus.Active,
      joinedAt: new Date().toISOString()
    },
    {
      id: 'owner-1',
      username: 'Rajesh Kumar',
      email: 'owner@example.com',
      role: UserRole.Owner,
      status: UserStatus.Active,
      joinedAt: new Date().toISOString()
    }
  ];
};

export const migrateLocalStorageToFirestore = async () => {
  console.log('Starting migration from localStorage to Firestore...');
  
  // 1. Migrate Config
  const localConfig = localStorage.getItem('erooms_config');
  if (localConfig) {
    try {
      const config = JSON.parse(localConfig) as AppConfig;
      await saveAppConfig(config);
      localStorage.removeItem('erooms_config');
      console.log('Config migrated successfully');
    } catch (e) {
      console.error('Failed to migrate config:', e);
    }
  }

  // 2. Migrate Properties
  const localProperties = localStorage.getItem('erooms_properties');
  if (localProperties) {
    try {
      const properties = JSON.parse(localProperties) as Property[];
      if (properties.length > 0) {
        await bulkSaveProperties(properties);
        localStorage.removeItem('erooms_properties');
        console.log(`${properties.length} properties migrated successfully`);
      }
    } catch (e) {
      console.error('Failed to migrate properties:', e);
    }
  }

  // 3. Migrate Leads
  const localLeads = localStorage.getItem('erooms_leads');
  if (localLeads) {
    try {
      const leads = JSON.parse(localLeads) as Lead[];
      for (const lead of leads) {
        await saveLead(lead);
      }
      localStorage.removeItem('erooms_leads');
      console.log(`${leads.length} leads migrated successfully`);
    } catch (e) {
      console.error('Failed to migrate leads:', e);
    }
  }

  // 4. Migrate Users
  const localUsers = localStorage.getItem('erooms_users');
  if (localUsers) {
    try {
      const users = JSON.parse(localUsers) as User[];
      for (const user of users) {
        await saveUser(user);
      }
      localStorage.removeItem('erooms_users');
      console.log(`${users.length} users migrated successfully`);
    } catch (e) {
      console.error('Failed to migrate users:', e);
    }
  }
  
  console.log('Migration completed.');
};
