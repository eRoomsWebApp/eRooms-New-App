import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query,
  where,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  Property,
  PropertyPrivate,
  ApprovalStatus,
  User,
  UserRole,
  UserStatus,
  AppConfig,
  Lead,
  ActivityLog
} from './types';
import { KOTA_AREAS, INSTITUTES, FACILITY_OPTIONS } from './constants';

export const CONFIG_UPDATED_EVENT = 'erooms_config_sync';
export const FIRESTORE_QUOTA_EVENT = 'erooms_firestore_quota';

const CONFIG_CACHE_KEY = 'erooms_cached_config_v2';
const PROPERTIES_CACHE_KEY = 'erooms_cached_properties_v2';
const CONFIG_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const PROPERTIES_CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

let quotaExceededFlag = false;

export const isQuotaExceededError = (error: unknown): boolean => {
  const msg = error instanceof Error ? error.message : String(error);
  const lower = msg.toLowerCase();
  return (
    lower.includes('quota') ||
    lower.includes('resource-exhausted') ||
    lower.includes('free daily read units')
  );
};

const markQuotaExceeded = () => {
  if (!quotaExceededFlag) {
    quotaExceededFlag = true;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(FIRESTORE_QUOTA_EVENT, { detail: { exceeded: true } }));
    }
  }
};

export const isFirestoreQuotaExceeded = () => quotaExceededFlag;

// --- PRIVATE FIELD ISOLATION ---
export const PRIVATE_FIELD_KEYS = [
  'OwnerWhatsApp',
  'OwnerEmail',
  'EmergencyContact',
  'FullAddress'
] as const;

export const stripPrivateFields = (property: Property): Property => {
  const cleaned = { ...property };
  delete cleaned.OwnerWhatsApp;
  delete cleaned.OwnerEmail;
  delete cleaned.EmergencyContact;
  delete cleaned.FullAddress;
  return cleaned;
};

export const extractPrivateFields = (property: Partial<Property> & { id: string; ownerId?: string }): PropertyPrivate | null => {
  const hasAny =
    property.OwnerWhatsApp !== undefined ||
    property.OwnerEmail !== undefined ||
    property.EmergencyContact !== undefined ||
    property.FullAddress !== undefined;
  if (!hasAny) return null;

  const result: PropertyPrivate = {
    id: property.id,
    ownerId: property.ownerId || auth.currentUser?.uid || 'unknown',
    updatedAt: new Date().toISOString()
  };
  if (property.OwnerWhatsApp !== undefined) result.OwnerWhatsApp = property.OwnerWhatsApp;
  if (property.OwnerEmail !== undefined) result.OwnerEmail = property.OwnerEmail;
  if (property.EmergencyContact !== undefined) result.EmergencyContact = property.EmergencyContact;
  if (property.FullAddress !== undefined) result.FullAddress = property.FullAddress;
  return result;
};

// --- PROPERTIES CACHE (6 HOURS) ---
export const getCachedPropertiesWithMeta = (): { properties: Property[]; isFresh: boolean } => {
  try {
    const raw = localStorage.getItem(PROPERTIES_CACHE_KEY);
    if (!raw) return { properties: [], isFresh: false };
    const parsed = JSON.parse(raw) as { properties?: Property[]; cachedAt?: number };
    const list = Array.isArray(parsed?.properties) ? parsed.properties.map(stripPrivateFields) : [];
    const isFresh =
      list.length > 0 && Date.now() - (parsed?.cachedAt || 0) < PROPERTIES_CACHE_TTL_MS;
    return { properties: list, isFresh };
  } catch {
    return { properties: [], isFresh: false };
  }
};

export const getCachedProperties = (): Property[] => getCachedPropertiesWithMeta().properties;

export const setCachedProperties = (properties: Property[]) => {
  try {
    localStorage.setItem(
      PROPERTIES_CACHE_KEY,
      JSON.stringify({
        properties: properties.map(stripPrivateFields),
        cachedAt: Date.now()
      })
    );
  } catch {
    // ignore storage quota errors
  }
};

// --- ERROR HANDLING ---
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write'
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
  };
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
      providerInfo:
        auth.currentUser?.providerData.map(provider => ({
          providerId: provider.providerId,
          displayName: provider.displayName,
          email: provider.email,
          photoUrl: provider.photoURL
        })) || []
    },
    operationType,
    path
  };
  if (isQuotaExceededError(error)) {
    console.warn('Firestore Quota Exceeded:', JSON.stringify(errInfo));
    markQuotaExceeded();
  } else {
    console.error('Firestore Error:', JSON.stringify(errInfo));
  }
  throw new Error(JSON.stringify(errInfo));
}

function logFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  if (isQuotaExceededError(error)) {
    console.warn(`Firestore Quota Exceeded on ${operationType} (${path})`);
    markQuotaExceeded();
  } else {
    console.error(`Firestore Error on ${operationType} (${path}):`, error);
  }
}

// --- APP CONFIG (24H CACHE) ---
export const DEFAULT_CONFIG: AppConfig = {
  siteName: 'eRooms.in',
  tagline: 'Verified Hostels & PG in Kota',
  heroDescription:
    'Compare verified student hostels and PGs across Kota near top coaching institutes — real photos, rent and facilities. Free visit, zero brokerage.',
  heroImages: [],
  announcements: [],
  footerText:
    "Kota's verified student housing catalogue by eRooms.in. Book free visits directly with our local Kota team.",
  maintenanceMode: false,
  allowNewRegistrations: true,
  supportWhatsApp: '919351099947',
  supportPhone: '+91 93510 99947',
  supportEmail: 'support@erooms.in',
  socialLinks: {
    instagram: 'https://www.instagram.com/erooms.in/',
    youtube: 'https://www.youtube.com/@eroomsin'
  },
  areas: KOTA_AREAS,
  institutes: INSTITUTES,
  facilities: FACILITY_OPTIONS,
  lastUpdated: new Date().toISOString()
};

const getCachedConfig = (): { config: AppConfig; isFresh: boolean } | null => {
  try {
    const raw = localStorage.getItem(CONFIG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { config: AppConfig; cachedAt: number };
    if (!parsed?.config) return null;
    const merged: AppConfig = {
      ...DEFAULT_CONFIG,
      ...parsed.config,
      socialLinks: {
        instagram: parsed.config.socialLinks?.instagram || DEFAULT_CONFIG.socialLinks.instagram,
        youtube: parsed.config.socialLinks?.youtube || DEFAULT_CONFIG.socialLinks.youtube
      }
    };
    return {
      config: merged,
      isFresh: Date.now() - (parsed.cachedAt || 0) < CONFIG_CACHE_TTL_MS
    };
  } catch {
    return null;
  }
};

const setCachedConfig = (config: AppConfig) => {
  try {
    localStorage.setItem(CONFIG_CACHE_KEY, JSON.stringify({ config, cachedAt: Date.now() }));
  } catch {
    // ignore storage quota errors
  }
};

export const getAppConfig = async (forceRefresh = false): Promise<AppConfig> => {
  const path = 'config/global';
  const cached = getCachedConfig();
  if (!forceRefresh && (cached?.isFresh || quotaExceededFlag)) {
    return cached?.config || DEFAULT_CONFIG;
  }
  try {
    const docSnap = await getDoc(doc(db, path));
    const remote = docSnap.exists() ? (docSnap.data() as Partial<AppConfig>) : {};
    const resolved: AppConfig = {
      ...DEFAULT_CONFIG,
      ...remote,
      socialLinks: {
        instagram: remote.socialLinks?.instagram || DEFAULT_CONFIG.socialLinks.instagram,
        youtube: remote.socialLinks?.youtube || DEFAULT_CONFIG.socialLinks.youtube
      }
    };
    setCachedConfig(resolved);
    return resolved;
  } catch (error) {
    logFirestoreError(error, OperationType.GET, path);
    return cached?.config || DEFAULT_CONFIG;
  }
};

export const saveAppConfig = async (config: AppConfig) => {
  const path = 'config/global';
  try {
    const cleanConfig = { ...config, lastUpdated: new Date().toISOString() };
    await setDoc(doc(db, path), cleanConfig);
    setCachedConfig(cleanConfig);
    window.dispatchEvent(new CustomEvent(CONFIG_UPDATED_EVENT, { detail: cleanConfig }));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// --- LEADS (ON-DEMAND ONLY FOR DASHBOARD, PUBLIC LEADS GO TO SHEETS) ---
export const fetchLeads = async (userId: string, role: string): Promise<Lead[]> => {
  const path = 'leads';
  try {
    const q =
      role === UserRole.Admin || role === UserRole.SuperAdmin
        ? query(collection(db, path), orderBy('timestamp', 'desc'))
        : query(collection(db, path), where('studentId', '==', userId), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => d.data() as Lead);
  } catch (error) {
    logFirestoreError(error, OperationType.LIST, path);
    return [];
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

// --- PROPERTIES (SINGLE READ + 6H CACHE) ---
export const fetchApprovedProperties = async (): Promise<Property[]> => {
  const path = 'properties';
  try {
    const q = query(collection(db, path), where('ApprovalStatus', '==', ApprovalStatus.Approved));
    const querySnapshot = await getDocs(q);
    const list = querySnapshot.docs.map(d => stripPrivateFields(d.data() as Property));
    setCachedProperties(list);
    return list;
  } catch (error) {
    logFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
};

export const fetchAllProperties = async (): Promise<Property[]> => {
  const path = 'properties';
  try {
    const querySnapshot = await getDocs(collection(db, path));
    return querySnapshot.docs.map(d => d.data() as Property);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const fetchOwnerProperties = async (ownerId: string): Promise<Property[]> => {
  const path = 'properties';
  try {
    const q = query(collection(db, path), where('ownerId', '==', ownerId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => d.data() as Property);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const fetchPropertyById = async (id: string): Promise<Property | null> => {
  const path = `properties/${id}`;
  try {
    const snap = await getDoc(doc(db, 'properties', id));
    if (!snap.exists()) return null;
    return stripPrivateFields(snap.data() as Property);
  } catch (error) {
    logFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const fetchPropertyPrivate = async (propertyId: string): Promise<PropertyPrivate | null> => {
  const path = `property_private/${propertyId}`;
  try {
    const snap = await getDoc(doc(db, 'property_private', propertyId));
    return snap.exists() ? (snap.data() as PropertyPrivate) : null;
  } catch (error) {
    logFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const savePropertyPrivate = async (privateData: PropertyPrivate) => {
  const path = `property_private/${privateData.id}`;
  try {
    await setDoc(doc(db, 'property_private', privateData.id), privateData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const saveProperty = async (property: Property) => {
  const path = `properties/${property.id}`;
  try {
    const publicProperty = stripPrivateFields(property);
    const privateData = extractPrivateFields(property);

    await setDoc(doc(db, 'properties', property.id), publicProperty);
    if (privateData) {
      await setDoc(doc(db, 'property_private', property.id), privateData, { merge: true });
    }
    await saveActivityLog({
      action: 'Property Saved',
      importance: 'medium',
      target: property.ListingName,
      metadata: { id: property.id, area: property.Area }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const updateProperty = async (id: string, updates: Partial<Property>) => {
  const path = `properties/${id}`;
  try {
    const publicUpdates: Record<string, unknown> = { ...updates };
    delete publicUpdates.OwnerWhatsApp;
    delete publicUpdates.OwnerEmail;
    delete publicUpdates.EmergencyContact;
    delete publicUpdates.FullAddress;

    if (Object.keys(publicUpdates).length > 0) {
      await updateDoc(doc(db, 'properties', id), publicUpdates);
    }

    const privateData = extractPrivateFields({
      id,
      ownerId: updates.ownerId,
      OwnerWhatsApp: updates.OwnerWhatsApp,
      OwnerEmail: updates.OwnerEmail,
      EmergencyContact: updates.EmergencyContact,
      FullAddress: updates.FullAddress
    });
    if (privateData) {
      await setDoc(doc(db, 'property_private', id), privateData, { merge: true });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteProperty = async (id: string) => {
  const path = `properties/${id}`;
  try {
    const propSnap = await getDoc(doc(db, 'properties', id));
    const propName = propSnap.exists() ? propSnap.data().ListingName : id;
    await deleteDoc(doc(db, 'properties', id));
    try {
      await deleteDoc(doc(db, 'property_private', id));
    } catch {
      // ignore if private doc did not exist
    }
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

export const bulkSaveProperties = async (properties: Property[]) => {
  const batch = writeBatch(db);
  properties.forEach(p => {
    const publicProperty = stripPrivateFields(p);
    const ref = doc(db, 'properties', p.id);
    batch.set(ref, publicProperty);

    const privateData = extractPrivateFields(p);
    if (privateData) {
      const privRef = doc(db, 'property_private', p.id);
      batch.set(privRef, privateData, { merge: true });
    }
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

export const migratePrivateFieldsToCollection = async (): Promise<{
  migratedCount: number;
  totalScanned: number;
}> => {
  const snap = await getDocs(collection(db, 'properties'));
  let migratedCount = 0;

  // Process in batches of up to 200 properties (each property uses 2 ops -> 400 < 500 Firestore batch limit)
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 200) {
    const chunk = docs.slice(i, i + 200);
    const batch = writeBatch(db);
    let chunkHasWrites = false;

    for (const d of chunk) {
      const data = d.data() as Property;
      const privateData = extractPrivateFields({ ...data, id: d.id });
      if (privateData) {
        chunkHasWrites = true;
        migratedCount++;
        batch.set(doc(db, 'property_private', d.id), privateData, { merge: true });
        batch.update(doc(db, 'properties', d.id), {
          OwnerWhatsApp: deleteField(),
          OwnerEmail: deleteField(),
          EmergencyContact: deleteField(),
          FullAddress: deleteField()
        });
      }
    }

    if (chunkHasWrites) {
      await batch.commit();
    }
  }

  return { migratedCount, totalScanned: docs.length };
};

// --- USERS (ON-DEMAND) ---
export const fetchUser = async (userId: string): Promise<User | null> => {
  const path = `users/${userId}`;
  try {
    const docSnap = await getDoc(doc(db, path));
    return docSnap.exists() ? (docSnap.data() as User) : null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const fetchUsersOnce = async (): Promise<User[]> => {
  const path = 'users';
  try {
    const q = query(collection(db, path), orderBy('username', 'asc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => d.data() as User);
  } catch (error) {
    logFirestoreError(error, OperationType.LIST, path);
    return [];
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
    await updateDoc(doc(db, 'users', userId), updates);
    await saveActivityLog({
      action: 'User Profile Updated',
      importance: 'medium',
      target: userId,
      metadata: { id: userId, updates: Object.keys(updates).join(', ') }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteUser = async (userId: string) => {
  const path = `users/${userId}`;
  try {
    await deleteDoc(doc(db, 'users', userId));
    await saveActivityLog({
      action: 'User Account Purged',
      importance: 'high',
      target: userId,
      metadata: { id: userId }
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// --- ACTIVITY LOGS (ON-DEMAND) ---
export const fetchActivityLogs = async (): Promise<ActivityLog[]> => {
  const path = 'activity_logs';
  try {
    const q = query(collection(db, path), orderBy('timestamp', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(d => d.data() as ActivityLog);
  } catch (error) {
    logFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};

export const saveActivityLog = async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
  if (!auth.currentUser) return;
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
    logFirestoreError(error, OperationType.WRITE, path);
  }
};

// --- DRAFTS ---
export const savePropertyDraft = (property: Partial<Property>) => {
  try {
    localStorage.setItem('erooms_property_draft', JSON.stringify(property));
  } catch {
    // ignore storage errors
  }
};

export const getPropertyDraft = (): Partial<Property> | null => {
  try {
    const draft = localStorage.getItem('erooms_property_draft');
    return draft ? JSON.parse(draft) : null;
  } catch {
    return null;
  }
};

export const clearPropertyDraft = () => {
  try {
    localStorage.removeItem('erooms_property_draft');
  } catch {
    // ignore
  }
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
    }
  ];
};
