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
  Approved = 'Approved',
  Rejected = 'Rejected'
}

export interface Lead {
  id: string;
  propertyId: string;
  propertyName: string;
  studentId: string;
  studentName: string;
  studentPhone: string;
  type: 'WhatsApp' | 'Call' | 'VisitRequest';
  status: 'New' | 'Contacted' | 'Closed';
  timestamp: string;
}

export interface Review {
  id: string;
  propertyId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  timestamp: string;
}

export enum UserRole {
  SuperAdmin = 'super_admin',
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
  heroImages: string[];
  announcements: { id: string; text: string; link?: string; active: boolean }[];
  footerText: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  supportWhatsApp: string;
  supportPhone: string;
  supportEmail: string;
  socialLinks: {
    instagram: string;
    youtube: string;
  };
  areas: string[];
  institutes: string[];
  facilities: string[];
  lastUpdated: string;
}

export interface DistanceMatrixItem {
  name: string;
  distance: number; // in meters or km depending on unit
  unit?: string;
}

export interface ActivityLog {
  id: string;
  action: string;
  target?: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
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
    listingType?: string;
    priceRange?: [number, number];
    selectedFacilities?: string[];
    maxDistance?: number;
    roomTypes?: string[];
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
  isVerified?: boolean;
  joinedAt?: string;
  address?: string;
  avatar?: string;
  college?: string;
  course?: string;
  businessName?: string;
  gstNumber?: string;
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
  shortlist?: string[];
  verificationDocs?: VerificationDoc[];
}

export interface VerificationDoc {
  id: string;
  type: 'Aadhar' | 'GST' | 'Other';
  url: string;
  status: ApprovalStatus;
  uploadedAt: string;
  reviewedAt?: string;
  rejectionReason?: string;
}

export interface PropertyPrivate {
  id: string;
  ownerId: string;
  OwnerWhatsApp?: string;
  OwnerEmail?: string;
  EmergencyContact?: string;
  FullAddress?: string;
  updatedAt?: string;
}

export interface Property {
  id: string;
  ownerId: string;
  ListingName: string;
  ListingType: ListingType;
  Gender: Gender;
  OwnerName: string;
  WardenName: string;
  Area: string;
  GoogleMapsPlusCode: string;
  InstituteDistanceMatrix: DistanceMatrixItem[];
  RentSingle: number[];
  RentDouble: number[];
  RentSingleDetails?: string;
  RentDoubleDetails?: string;
  SecurityTerms: string;
  ValidationIssues?: string[];
  ElectricityCharges: number;
  Maintenance: number;
  ParentsStayCharge: number;
  Facilities: string[];
  PhotoMain: string;
  PhotoRoom: string;
  PhotoWashroom: string;
  PhotosGallery?: string[];
  SecurityDeposit?: string;
  ApprovalStatus: ApprovalStatus;
  lat?: number;
  lng?: number;
  views?: number;
  leadsCount?: number;
  rating?: number;
  isFeatured?: boolean;
  priorityScore?: number;
  // Private fields are stored in property_private/{id} and never exposed publicly;
  // kept optional only for owner/admin form submission and migration tooling.
  OwnerWhatsApp?: string;
  OwnerEmail?: string;
  EmergencyContact?: string;
  FullAddress?: string;
}
