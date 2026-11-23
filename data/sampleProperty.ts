import { Property, ListingType, Gender, ApprovalStatus } from '../types';
import mainExteriorImg from '../src/assets/images/hostel_exterior_main_1795397312235.webp';
import roomInteriorImg from '../src/assets/images/hostel_room_interior_1795397312282.webp';
import washroomModernImg from '../src/assets/images/hostel_washroom_modern_1795397312477.webp';
import diningLoungeImg from '../src/assets/images/hostel_dining_lounge_1795397312999.webp';

export const SAMPLE_PREVIEW_PROPERTY_ID = 'kota-elite-preview-1';

export const SAMPLE_PREVIEW_PROPERTY: Property = {
  id: SAMPLE_PREVIEW_PROPERTY_ID,
  ownerId: 'preview-owner-1',
  ListingName: 'Aaravya Residency Elite',
  ListingType: ListingType.Hostel,
  Gender: Gender.Boys,
  OwnerName: 'Aaravya Residency Management',
  WardenName: 'On-Site Hostel Warden',
  Area: 'Landmark City (Kunadi)',
  GoogleMapsPlusCode: '5RFM+7Q Kota, Rajasthan',
  InstituteDistanceMatrix: [
    { name: 'Allen Sangyan', distance: 0.3, unit: 'km' },
    { name: 'Allen Samyak', distance: 0.6, unit: 'km' },
    { name: 'PW Vidyapeeth', distance: 0.8, unit: 'km' },
    { name: 'Motion', distance: 1.1, unit: 'km' },
    { name: 'Resonance', distance: 1.4, unit: 'km' },
    { name: 'City Hospital & Trauma Pulse', distance: 0.9, unit: 'km' },
    { name: 'Kunadi Central Bus Stand', distance: 0.5, unit: 'km' },
    { name: 'Brew & Study Cafe Corner', distance: 0.2, unit: 'km' }
  ],
  RentSingle: [16500, 18500],
  RentDouble: [12500, 14000],
  RentSingleDetails: 'Single AC Suite • Attached Washroom • Study Balcony • 4-Time Mess Included',
  RentDoubleDetails: 'Twin Sharing AC Room • Dual Ergonomic Desks • Hygienic Mess & Laundry Included',
  SecurityTerms: '1 Month Refundable Security Deposit • Zero Brokerage • 30-Day Prior Notice',
  SecurityDeposit: '₹12,500',
  ElectricityCharges: 10,
  Maintenance: 1500,
  ParentsStayCharge: 500,
  Facilities: [
    'AC',
    'WiFi',
    'Attached Washroom',
    'Geyser',
    'Laundry',
    'Balcony',
    'RO Water',
    'Mess Facility',
    'Study Table',
    'Wardrobe',
    'CCTV',
    'Biometric Entry'
  ],
  PhotoMain: mainExteriorImg,
  PhotoRoom: roomInteriorImg,
  PhotoWashroom: washroomModernImg,
  PhotosGallery: [diningLoungeImg],
  ApprovalStatus: ApprovalStatus.Approved,
  lat: 25.2138,
  lng: 75.8392,
  isFeatured: true,
  priorityScore: 100
};
