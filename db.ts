
import { Property, ListingType, Gender, ApprovalStatus } from './types';

const STORAGE_KEY = 'erooms_properties_v2';

export const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    ownerId: 'owner',
    ListingName: 'Raj Residency Elite',
    ListingType: ListingType.Hostel,
    Gender: Gender.Boys,
    OwnerName: 'Rajesh Sharma',
    OwnerWhatsApp: '919876543210',
    WardenName: 'Suresh Kumar',
    EmergencyContact: '919123456789',
    OwnerEmail: 'contact@rajresidency.com',
    Area: 'Landmark City (Kunadi)',
    FullAddress: 'Plot 45, Sector B, Landmark City, Kunadi, Kota, Rajasthan',
    GoogleMapsPlusCode: '6VG5+XG Kota, Rajasthan',
    InstituteDistanceMatrix: [
      { name: 'Allen Samyak', distance: 0.2 },
      { name: 'Allen Sangyan', distance: 0.5 },
      { name: 'Allen Supath', distance: 1.2 }
    ],
    RentSingle: 14500,
    RentDouble: 8500,
    SecurityTerms: '1 Month Advance Security (Refundable)',
    ElectricityCharges: 12,
    Maintenance: 2000,
    ParentsStayCharge: 500,
    Facilities: ['AC', 'Attached Washroom', 'Geyser', 'Laundry', 'Biometric Entry', 'Mess Facility'],
    PhotoMain: 'https://picsum.photos/seed/hostel1/1200/800',
    PhotoRoom: 'https://picsum.photos/seed/room1/1200/800',
    PhotoWashroom: 'https://picsum.photos/seed/wash1/1200/800',
    ApprovalStatus: ApprovalStatus.Approved
  },
  {
    id: '2',
    ownerId: 'owner_alt',
    ListingName: 'Gargi Kanya Niwas',
    ListingType: ListingType.PG,
    Gender: Gender.Girls,
    OwnerName: 'Sunita Garg',
    OwnerWhatsApp: '918822334455',
    WardenName: 'Mamta Devi',
    EmergencyContact: '918877665544',
    OwnerEmail: 'info@garginiwas.com',
    Area: 'Talwandi',
    FullAddress: 'House 12-A, Talwandi, Near Commerce College Road, Kota',
    GoogleMapsPlusCode: '5VPX+W3 Kota, Rajasthan',
    InstituteDistanceMatrix: [
      { name: 'Allen Safalya', distance: 0.4 },
      { name: 'Allen Satyarth', distance: 0.8 }
    ],
    RentSingle: 12000,
    RentDouble: 7000,
    SecurityTerms: '5000/- Security Amount',
    ElectricityCharges: 10,
    Maintenance: 1500,
    ParentsStayCharge: 300,
    Facilities: ['CCTV', 'RO Water', 'Laundry', 'Mess Facility', 'Study Table'],
    PhotoMain: 'https://picsum.photos/seed/hostel2/1200/800',
    PhotoRoom: 'https://picsum.photos/seed/room2/1200/800',
    PhotoWashroom: 'https://picsum.photos/seed/wash2/1200/800',
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
