
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Wind, Wifi, Utensils, WashingMachine, Cctv, Droplet, 
  Zap, Bath, BookOpen, Shirt, Sun, Star 
} from 'lucide-react';
import { Property, Gender } from '../types';

interface PropertyCardProps {
  property: Property;
}

const facilityIconMap: Record<string, React.ElementType> = {
  'AC': Wind,
  'WiFi': Wifi,
  'Mess Facility': Utensils,
  'Laundry': WashingMachine,
  'CCTV': Cctv,
  'RO Water': Droplet,
  'Geyser': Zap,
  'Attached Washroom': Bath,
  'Study Table': BookOpen,
  'Wardrobe': Shirt,
  'Balcony': Sun
};

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const genderColor = property.Gender === Gender.Boys ? 'bg-blue-500 text-white' : 
                      property.Gender === Gender.Girls ? 'bg-pink-500 text-white' : 
                      'bg-slate-500 text-white';

  const nearest = property.InstituteDistanceMatrix[0];
  const minsWalk = nearest ? Math.ceil(nearest.distance * 12) : null;

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group relative"
    >
      <Link to={`/property/${property.id}`} className="block overflow-hidden bg-white rounded-[24px] border border-[#e2e8f0] hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all duration-500">
        <div className="relative aspect-[4/3] overflow-hidden">
          <img 
            src={property.PhotoMain} 
            alt={property.ListingName} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
          />
          
          <div className="absolute top-4 left-4 flex gap-2">
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-lg backdrop-blur-md ${genderColor}`}>
              {property.Gender}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur-md">
              {property.ListingType}
            </span>
          </div>

          <div className="absolute top-4 right-4">
            <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-full shadow-lg border border-white/50">
              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-5-5 1.41-1.41L10 13.17l7.59-7.59L19 7l-9 9z"/>
              </svg>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
             <div className="bg-slate-900/40 backdrop-blur-xl rounded-2xl p-3 border border-white/20 flex items-center justify-between text-white shadow-xl">
               <div className="flex items-center gap-2">
                 <span className="text-xl">🚶</span>
                 <p className="text-xs font-bold leading-tight">
                    {minsWalk} mins walk <br/>
                    <span className="text-white/60 font-medium">to {nearest?.name}</span>
                 </p>
               </div>
               <div className="h-8 w-px bg-white/20"></div>
               <div className="text-right">
                  <p className="text-[10px] uppercase font-black tracking-widest text-white/60">Area</p>
                  <p className="text-xs font-bold">{property.Area.split(' (')[0]}</p>
               </div>
             </div>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-extrabold text-xl text-slate-900 tracking-tight line-clamp-1">{property.ListingName}</h3>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {property.Facilities.slice(0, 3).map(f => {
              const Icon = facilityIconMap[f] || Star;
              return (
                <div key={f} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 bg-slate-50 border border-slate-100 px-2 py-1.5 rounded-lg">
                  <Icon size={12} className="text-indigo-500" />
                  {f}
                </div>
              );
            })}
            {property.Facilities.length > 3 && <span className="text-[10px] font-bold text-slate-400 px-2 py-1">+{property.Facilities.length - 3}</span>}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-50">
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.15em] mb-1">Monthly Rental</p>
              <p className="text-2xl font-black text-indigo-600 tracking-tighter">
                ₹{property.RentDouble.toLocaleString()}
                <span className="text-xs font-bold text-slate-400 ml-1">/mo</span>
              </p>
            </div>
            <div className="bg-slate-50 group-hover:bg-slate-900 group-hover:text-white p-3 rounded-2xl transition-all duration-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PropertyCard;

