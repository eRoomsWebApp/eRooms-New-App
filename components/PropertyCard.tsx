import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wind,
  Wifi,
  Utensils,
  WashingMachine,
  Cctv,
  Droplet,
  Zap,
  Bath,
  BookOpen,
  Shirt,
  Sun,
  Star,
  MessageCircle,
  Phone,
  Calendar
} from 'lucide-react';
import { Property, Gender } from '../types';
import { transformDriveUrl } from '../utils/urlHelper';
import { getPropertyPath } from '../utils/slug';
import { useLeadCapture } from './LeadCaptureSheet';
import { useProperties } from '../context/PropertyContext';
import OptimizedImage from './OptimizedImage';

interface PropertyCardProps {
  property: Property;
  priority?: boolean;
}

const facilityIconMap: Record<string, React.ElementType> = {
  AC: Wind,
  WiFi: Wifi,
  'Mess Facility': Utensils,
  Laundry: WashingMachine,
  CCTV: Cctv,
  'RO Water': Droplet,
  Geyser: Zap,
  'Attached Washroom': Bath,
  'Study Table': BookOpen,
  Wardrobe: Shirt,
  Balcony: Sun
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property, priority = false }) => {
  const { triggerLeadAction } = useLeadCapture();
  const { filters } = useProperties();

  const genderColor =
    property.Gender === Gender.Boys
      ? 'bg-blue-600 text-white'
      : property.Gender === Gender.Girls
        ? 'bg-pink-600 text-white'
        : 'bg-slate-700 text-white';

  const nearest = property.InstituteDistanceMatrix?.[0];
  const distanceKm = nearest
    ? nearest.unit === 'm' || nearest.distance > 50
      ? nearest.distance / 1000
      : nearest.distance
    : null;
  const minsWalk = distanceKm !== null ? Math.max(1, Math.ceil(distanceKm * 12)) : null;

  const rents = [
    ...(Array.isArray(property.RentDouble) ? property.RentDouble : []),
    ...(Array.isArray(property.RentSingle) ? property.RentSingle : [])
  ].filter(n => typeof n === 'number' && n > 0);
  const minRent = rents.length > 0 ? Math.min(...rents) : 0;
  const hasMultiplePrices = rents.length > 1;
  const propertyUrl = getPropertyPath(property);

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 24 }}
      className="group relative flex flex-col overflow-hidden bg-white rounded-[24px] border border-slate-200 hover:shadow-[0_20px_40px_rgba(37,99,235,0.08)] transition-all duration-300"
    >
      <Link to={propertyUrl} className="block flex-1">
        <div className="relative aspect-[4/3] overflow-hidden">
          <OptimizedImage
            src={transformDriveUrl(property.PhotoMain, 400)}
            alt={`${property.ListingName} in ${property.Area}, Kota`}
            width={400}
            height={300}
            priority={priority}
            fit="contain"
            className="w-full h-full bg-slate-100"
          />

          <div className="absolute top-4 left-4 flex gap-2">
            <span
              className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md ${genderColor}`}
            >
              {property.Gender}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/95 text-slate-900 shadow-lg backdrop-blur-md">
              {property.ListingType}
            </span>
          </div>

          <div className="absolute top-4 right-4">
            <div
              title="eRooms Verified Property"
              className="bg-white/95 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-white/50"
            >
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L10 13.17l7.59-7.59L19 7l-9 9z" />
              </svg>
            </div>
          </div>

        </div>

        {nearest && (
          <div className="mx-4 mt-3 bg-slate-50 rounded-2xl px-3 py-2.5 border border-slate-100 flex items-center text-slate-700 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base flex-shrink-0">🚶</span>
              <p className="text-xs font-bold leading-tight min-w-0">
                {minsWalk} mins walk
                <span className="text-slate-500 font-medium truncate block">to {nearest.name}</span>
              </p>
            </div>
          </div>
        )}

        <div className="p-5 pb-3">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-extrabold text-lg text-slate-900 tracking-tight line-clamp-1 group-hover:text-blue-600 transition-colors">
              {property.ListingName}
            </h3>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-4">
            {(property.Facilities || []).slice(0, 3).map(f => {
              const Icon = facilityIconMap[f] || Star;
              return (
                <div
                  key={f}
                  className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-100 px-2 py-1 rounded-lg"
                >
                  <Icon size={11} className="text-blue-600" />
                  {f}
                </div>
              );
            })}
            {(property.Facilities || []).length > 3 && (
              <span className="text-[10px] font-bold text-slate-400 px-1 py-1">
                +{property.Facilities.length - 3}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-[0.15em] mb-0.5">
                {hasMultiplePrices ? 'Starting From' : 'Monthly Rent'}
              </p>
              <p className="text-xl font-black text-blue-600 tracking-tighter">
                ₹{minRent.toLocaleString('en-IN')}
                <span className="text-xs font-bold text-slate-400 ml-1">/mo</span>
              </p>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
              {property.Area.split(' (')[0]}
            </span>
          </div>
        </div>
      </Link>

      {/* No-Login Direct eRooms Lead Actions */}
      <div className="px-5 pb-5 pt-2 flex flex-col gap-2">
        <button
          type="button"
          onClick={() =>
            triggerLeadAction('Get Details on WhatsApp', property, filters.coaching)
          }
          className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-colors shadow-sm"
        >
          <MessageCircle size={14} /> Get Details on WhatsApp
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => triggerLeadAction('Call eRooms', property, filters.coaching)}
            className="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
          >
            <Phone size={13} /> Call eRooms
          </button>
          <button
            type="button"
            onClick={() => triggerLeadAction('Book Free Visit', property, filters.coaching)}
            className="py-2.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
          >
            <Calendar size={13} /> Book Free Visit
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PropertyCard;
