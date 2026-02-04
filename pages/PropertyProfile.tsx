
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wind, Wifi, Utensils, WashingMachine, Cctv, Droplet, 
  Zap, Bath, BookOpen, Shirt, Sun, Star, MapPin, 
  Phone, Mail, ShieldCheck, Video, Info, CreditCard, 
  User, ShieldAlert, MessageCircle, ExternalLink,
  ChevronRight, Calendar, Sparkles, Map as MapIcon
} from 'lucide-react';
import { useProperties } from '../context/PropertyContext';
import { Gender } from '../types';

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

const PropertyProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { properties, loading } = useProperties();
  const property = properties.find(p => p.id === id);
  const [activeRentType, setActiveRentType] = useState<'Single' | 'Double'>('Double');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50">
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full"
      />
    </div>
  );

  if (!property) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 px-4">
      <div className="bg-white p-12 rounded-[32px] border border-slate-200 text-center shadow-xl">
        <h1 className="text-3xl font-black text-slate-900 mb-4">Listing Not Located</h1>
        <p className="text-slate-500 mb-8 font-medium">The requested property profile is unavailable or may have been re-indexed.</p>
        <Link to="/" className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black transition-all hover:bg-indigo-600">
          Return to Hub
        </Link>
      </div>
    </div>
  );

  // Safe data extraction to prevent runtime crashes
  const sortedMatrix = [...(property.InstituteDistanceMatrix || [])].sort((a, b) => a.distance - b.distance);
  const facilityList = property.Facilities || [];
  const mainImage = property.PhotoMain || 'https://images.unsplash.com/photo-1555854817-5b2260d07c47?q=80&w=2070&auto=format&fit=crop';
  const roomImage = property.PhotoRoom || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=2071&auto=format&fit=crop';
  const washroomImage = property.PhotoWashroom || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="bg-neutral-50 min-h-screen selection:bg-indigo-100 selection:text-indigo-900">
      <div className="max-w-7xl mx-auto px-4 py-12 lg:py-20">
        
        {/* Elite Breadcrumb */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10 flex items-center gap-3 text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em]">
          <Link to="/" className="hover:text-slate-900 transition-colors">Kota</Link>
          <ChevronRight size={12} className="opacity-40" />
          <span className="hover:text-slate-900 cursor-pointer">{property.Area?.split(' (')[0] || 'Unassigned Cluster'}</span>
          <ChevronRight size={12} className="opacity-40" />
          <span className="text-slate-900">{property.ListingName}</span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content Column */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="lg:col-span-8 space-y-20"
          >
            
            {/* Elite Identity Hub */}
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.25em] shadow-sm ${
                  property.Gender === Gender.Boys ? 'bg-indigo-600 text-white' : property.Gender === Gender.Girls ? 'bg-pink-600 text-white' : 'bg-slate-900 text-white'
                }`}>
                  {property.Gender} Target
                </span>
                <div className="bg-white border border-slate-100 text-slate-400 font-black text-[10px] uppercase tracking-widest px-5 py-2 rounded-full flex items-center gap-2">
                  <ShieldCheck size={14} className="text-green-500" />
                  Audit: Verified Property
                </div>
                {property.ListingType && (
                  <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest bg-slate-100 px-4 py-2 rounded-full">
                    Category: {property.ListingType}
                  </span>
                )}
              </div>
              <h1 className="text-6xl lg:text-8xl font-black text-slate-900 tracking-tighter leading-[0.85]">{property.ListingName}</h1>
              <p className="text-xl text-slate-500 font-bold flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600">
                  <MapPin size={20} />
                </div>
                {property.FullAddress || 'Exact coordinates pending sync...'}
              </p>
            </div>

            {/* Asymmetric Master Gallery */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-12 gap-5 h-[650px] group">
              <div className="md:col-span-8 rounded-[40px] overflow-hidden relative border border-white shadow-2xl bg-slate-100">
                <img src={mainImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Property Profile" />
                <div className="absolute top-8 left-8">
                   <div className="glass-card px-5 py-3 rounded-2xl flex items-center gap-3 border-white/40 shadow-xl">
                      <Sparkles size={20} className="text-amber-400" />
                      <span className="text-slate-900 text-[11px] font-black uppercase tracking-widest">Premium Listing Narrative</span>
                   </div>
                </div>
                <div className="absolute bottom-8 right-8">
                   <button className="bg-white/95 backdrop-blur-md text-slate-900 px-8 py-4 rounded-[24px] font-black text-xs uppercase tracking-widest flex items-center gap-3 border border-white hover:bg-slate-900 hover:text-white transition-all shadow-2xl active:scale-95">
                      <Video size={18} />
                      Stream 4K VR Tour
                   </button>
                </div>
              </div>
              <div className="md:col-span-4 flex flex-col gap-5">
                <div className="flex-1 rounded-[40px] overflow-hidden border border-white shadow-lg relative group/item bg-slate-100">
                  <img src={roomImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover/item:scale-110" alt="Room Aesthetics" />
                  <div className="absolute bottom-6 left-6 text-white text-[9px] font-black uppercase tracking-widest bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">Private Space</div>
                </div>
                <div className="flex-1 rounded-[40px] overflow-hidden border border-white shadow-lg relative group/item bg-slate-100">
                  <img src={washroomImage} className="w-full h-full object-cover transition-transform duration-1000 group-hover/item:scale-110" alt="Hygiene Hub" />
                  <div className="absolute bottom-6 left-6 text-white text-[9px] font-black uppercase tracking-widest bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full">Hygiene Narrative</div>
                </div>
              </div>
            </motion.div>

            {/* Proximity Grid */}
            <motion.section variants={itemVariants} className="space-y-10">
              <div className="flex items-center justify-between">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                   Proximity Hub
                   <div className="h-px w-24 bg-slate-200"></div>
                </h2>
                <div className="bg-indigo-50 text-indigo-700 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 flex items-center gap-2">
                   <MapIcon size={14} />
                   Synced from G-Maps
                </div>
              </div>
              {sortedMatrix.length > 0 ? (
                <div className="flex gap-5 overflow-x-auto no-scrollbar pb-6 -mx-4 px-4 scroll-smooth">
                  {sortedMatrix.map((item, idx) => (
                    <motion.div 
                      key={idx} 
                      whileHover={{ y: -8, backgroundColor: "#0f172a", color: "#ffffff" }}
                      className="min-w-[300px] bg-white border border-slate-100 rounded-[32px] p-8 shadow-sm transition-all group cursor-default"
                    >
                      <div className="flex items-center gap-5 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                          <MapPin size={28} />
                        </div>
                        <div>
                          <p className="font-black text-inherit leading-tight text-lg">{item.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest group-hover:text-white/40">Coaching Entity</p>
                        </div>
                      </div>
                      <div className="flex items-end justify-between border-t border-slate-50 group-hover:border-white/10 pt-6">
                        <div>
                          <p className="text-4xl font-black text-inherit tracking-tighter">{item.distance}<span className="text-sm ml-1 opacity-40 font-bold">KM</span></p>
                          <p className="text-[11px] font-black text-indigo-600 uppercase group-hover:text-indigo-400">Proximity</p>
                        </div>
                        <div className="text-right">
                           <p className="text-xl font-black text-green-500 group-hover:text-green-400">🚶 {Math.ceil(item.distance * 12)}</p>
                           <p className="text-[10px] font-black text-slate-300 uppercase group-hover:text-white/20">Mins Walk</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-16 bg-slate-100 rounded-[40px] text-center border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-lg text-slate-300">
                    <MapIcon size={24} />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-[11px]">Proximity Matrix Pending Sync...</p>
                </div>
              )}
            </motion.section>

            {/* Financial Card Overhaul */}
            <motion.section variants={itemVariants}>
              <div className="bg-indigo-50 border border-indigo-100 rounded-[48px] p-10 lg:p-16 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-10 -right-10 p-10 opacity-[0.03] pointer-events-none rotate-12">
                  <CreditCard size={350} />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-16 relative z-10">
                  <div>
                    <h2 className="text-4xl font-black text-slate-900 tracking-tight mb-6">Financial Matrix</h2>
                    <p className="text-slate-500 font-bold text-lg leading-relaxed mb-10">Calculated based on <span className="text-indigo-600">Premium Tiers</span> and area-specific demand metrics. Full transparency guaranteed.</p>
                    <div className="flex p-1.5 bg-white rounded-3xl border border-slate-100 shadow-sm max-w-sm">
                       <button 
                         onClick={() => setActiveRentType('Single')}
                         className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                           activeRentType === 'Single' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'
                         }`}
                       >
                         Single Occupancy
                       </button>
                       <button 
                         onClick={() => setActiveRentType('Double')}
                         className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                           activeRentType === 'Double' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'
                         }`}
                       >
                         Double Shared
                       </button>
                    </div>
                  </div>
                  <div className="text-center lg:text-right">
                    <p className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-4">Baseline Commitment</p>
                    <motion.div 
                      key={activeRentType}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-8xl lg:text-[140px] font-black text-slate-900 tracking-tighter leading-[0.8]"
                    >
                      <span className="text-4xl lg:text-5xl align-top mr-2 text-indigo-200">₹</span>
                      {(activeRentType === 'Single' ? property.RentSingle : property.RentDouble)?.toLocaleString() || '0'}
                    </motion.div>
                    <p className="text-lg font-black text-slate-400 mt-6 tracking-tight uppercase opacity-60">Per Calendar Month • Standard T&C</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                   {[
                     { label: 'Energy Unit Charge', val: `₹${property.ElectricityCharges || 0}`, sub: 'Metered Consumption', icon: Zap },
                     { label: 'One-Time Maintenance', val: `₹${(property.Maintenance || 0).toLocaleString()}`, sub: 'Facility Sustain Fee', icon: Info },
                     { label: 'Parent Guest Rate', val: `₹${property.ParentsStayCharge || 0}`, sub: 'Nightly Stay Allocation', icon: User }
                   ].map((item, i) => (
                     <div key={i} className="bg-white/90 backdrop-blur-xl rounded-[32px] p-8 border border-white shadow-lg flex flex-col items-center text-center gap-4 group hover:bg-white transition-all">
                        <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <item.icon size={28} strokeWidth={2} />
                        </div>
                        <div>
                           <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">{item.label}</p>
                           <p className="text-3xl font-black text-slate-900 tracking-tight mb-1">{item.val}</p>
                           <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{item.sub}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </motion.section>

            {/* Amenity Narrative */}
            <motion.section variants={itemVariants} className="space-y-12">
               <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-6">
                 Property DNA
                 <div className="h-px flex-grow bg-slate-100"></div>
               </h2>
               <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {facilityList.length > 0 ? facilityList.map(f => {
                    const Icon = facilityIconMap[f] || Star;
                    return (
                      <div key={f} className="flex flex-col items-center justify-center gap-4 bg-white border border-slate-100 p-8 rounded-[32px] hover:bg-slate-900 hover:text-white group transition-all duration-500 cursor-default shadow-sm hover:shadow-2xl">
                         <Icon size={32} className="text-indigo-600 group-hover:text-white transition-colors" strokeWidth={1.5} />
                         <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center leading-tight opacity-60 group-hover:opacity-100">{f}</span>
                      </div>
                    );
                  }) : (
                    <div className="col-span-full py-20 text-center bg-slate-100 rounded-[40px] border-2 border-dashed border-slate-200">
                      <p className="text-slate-300 font-black uppercase tracking-widest text-[11px]">Amenity check in progress...</p>
                    </div>
                  )}
               </div>
            </motion.section>

          </motion.div>

          {/* Sticky Sidebar Management Column */}
          <div className="lg:col-span-4 space-y-8">
            <div className="sticky top-28 space-y-8">
              
              {/* Primary Call to Action */}
              <div className="bg-white rounded-[40px] p-10 shadow-2xl border border-slate-50 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 text-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity">
                   <Calendar size={80} />
                </div>
                <div className="mb-10 relative z-10">
                  <p className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-3">Priority Access</p>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter leading-tight">Secure Your Viewing Session</h3>
                </div>
                <button className="w-full bg-slate-900 text-white py-7 rounded-[32px] font-black text-xl hover:bg-indigo-600 transition-all active:scale-95 shadow-2xl shadow-slate-200 relative z-10">
                  Initiate Booking
                </button>
                <p className="text-[10px] text-center font-bold text-slate-300 uppercase tracking-widest mt-6">Zero Commission • Real-Time Availability</p>
              </div>

              {/* Safety/Warden Narrative */}
              <div className="bg-slate-900 text-white p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
                   <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-colors"></div>
                   <div className="flex items-center gap-5 mb-10">
                      <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center text-4xl shadow-inner">👮</div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-1">Elite Management</p>
                        <p className="text-2xl font-black tracking-tight">{property.WardenName || 'Allocated Personnel'}</p>
                      </div>
                   </div>
                   <div className="bg-red-500/10 border border-red-500/20 p-7 rounded-[32px] group-hover:bg-red-500/20 transition-all">
                      <p className="text-[11px] font-black uppercase text-red-400 tracking-[0.2em] mb-2 flex items-center gap-3">
                        <ShieldAlert size={16} /> Immediate Assistance
                      </p>
                      <p className="text-3xl font-black font-mono tracking-widest text-red-50">{property.EmergencyContact || 'Audit Pending'}</p>
                   </div>
                   <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mt-6 text-center italic">Safety Protocols Engaged 24/7</p>
              </div>

              {/* Ownership Matrix */}
              <div className="bg-white border border-slate-100 p-10 rounded-[40px] shadow-xl group">
                   <div className="flex items-center gap-5 mb-10">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center text-3xl font-black text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                         {property.OwnerName?.[0] || 'E'}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-1">Direct Operator</p>
                        <p className="text-2xl font-black text-slate-900 tracking-tight">{property.OwnerName}</p>
                      </div>
                   </div>
                   <a 
                      href={`https://wa.me/${property.OwnerWhatsApp}`}
                      target="_blank" rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-4 py-5 bg-[#2563eb] text-white rounded-[28px] font-black uppercase tracking-widest text-xs hover:bg-[#0f172a] transition-all shadow-xl shadow-blue-100 group-hover:translate-y-[-2px]"
                   >
                      <MessageCircle size={20} /> Establish Connect
                   </a>
                   <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-center gap-6 opacity-40">
                      <div className="flex flex-col items-center">
                         <Mail size={16} />
                         <span className="text-[8px] font-black uppercase mt-1">E-Mail</span>
                      </div>
                      <div className="flex flex-col items-center">
                         <Phone size={16} />
                         <span className="text-[8px] font-black uppercase mt-1">Direct</span>
                      </div>
                   </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyProfile;
