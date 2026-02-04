
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

export interface DistanceMatrixItem {
  name: string;
  distance: number; // in kilometers
}

export interface User {
  id: string;
  username: string;
  // Added email to support registration and identification in the UI and Auth logic
  email: string;
  role: UserRole;
}

export interface Property {
  id: string; // Internal unique ID
  ownerId: string; // ID of the user who owns this listing
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
  ElectricityCharges: number; // Per unit
  Maintenance: number; // One-time
  ParentsStayCharge: number; // Per day
  Facilities: string[];
  PhotoMain: string;
  PhotoRoom: string;
  PhotoWashroom: string;
  ApprovalStatus: ApprovalStatus;
}
