
export enum ListingType {
  Hostel = 'Hostel',
  PG = 'PG',
  Flat = 'Flat',
  Mess = 'Mess'
}

export enum Gender {
  Boys = 'Boys',
  Girls = 'Girls',
  Unisex = 'Unisex'
}

export enum ApprovalStatus {
  Pending = 'Pending',
  Approved = 'Approved'
}

export enum UserRole {
  Admin = 'admin',
  Owner = 'owner',
  Student = 'student'
}

export enum UserStatus {
  Active = 'Active',
  Suspended = 'Suspended',
  Flagged = 'Flagged'
}

export interface AppConfig {
  siteName: string;
  tagline: string;
  heroDescription: string;
  footerText: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  supportWhatsApp: string;
  supportPhone: string;
  supportEmail: string;
  socialLinks: {
    instagram: string;
    twitter: string;
    linkedin: string;
  };
  areas: string[];
  institutes: string[];
  facilities: string[];
  lastUpdated: string;
}

export interface DistanceMatrixItem {
  name: string;
  distance: number; // in kilometers
}

export interface ActivityLog {
  id: string;
  action: string;
  target?: string;
  timestamp: string;
  metadata?: Record<string, any>;
  importance: 'low' | 'medium' | 'high';
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: {
    coaching: string;
    gender: string;
    area: string;
    activePills: string[];
  };
  timestamp: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  phone?: string;
  role: UserRole;
  status?: UserStatus;
  joinedAt?: string;
  address?: string;
  avatar?: string;
  behavioralMetrics?: {
    avgSessionTime: number; 
    totalSessions: number;
    pricePreference: { min: number; max: number };
    topAreas: string[];
    topFacilities: string[];
    searchDepth: number; 
  };
  activityLog?: ActivityLog[];
  savedSearches?: SavedSearch[];
}

export interface Property {
  id: string; 
  ownerId: string; 
  ListingName: string;
  ListingType: ListingType;
  Gender: Gender;
  OwnerName: string;
  OwnerWhatsApp: string;
  WardenName: string;
  EmergencyContact: string;
  OwnerEmail: string;
  Area: string;
  FullAddress: string;
  GoogleMapsPlusCode: string;
  InstituteDistanceMatrix: DistanceMatrixItem[];
  RentSingle: number;
  RentDouble: number;
  SecurityTerms: string;
  ElectricityCharges: number; 
  Maintenance: number; 
  ParentsStayCharge: number; 
  Facilities: string[];
  PhotoMain: string;
  PhotoRoom: string;
  PhotoWashroom: string;
  ApprovalStatus: ApprovalStatus;
}
