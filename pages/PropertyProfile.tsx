
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wind, Wifi, Utensils, WashingMachine, Cctv, Droplet, 
  Zap, Bath, BookOpen, Shirt, Sun, Star, MapPin, 
  Phone, ShieldCheck, Heart, Share2, Navigation, Coffee, Stethoscope, Bus,
  CheckCircle2, ShieldAlert, ArrowLeft, MessageCircle, LayoutGrid, Shield as Safety, Coffee as Cup
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
  'Balcony': Sun,
  'Biometric Entry': Safety
};

const PropertyProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { properties, loading } = useProperties();
  const property = properties.find(p => p.id === id);
  const [activeRentType, setActiveRentType] = useState<'Single' | 'Double'>('Double');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Defensive Category Logic
  const categorizedFacilities = useMemo(() => {
    const facs = property?.Facilities || [];
    return {
      essential: facs.filter(f => ['RO Water', 'Mess Facility', 'Study Table', 'Wardrobe'].includes(f)),
      comfort: facs.filter(f => ['AC', 'WiFi', 'Laundry', 'Geyser', 'Balcony', 'Attached Washroom'].includes(f)),
      safety: facs.filter(f => ['CCTV', 'Biometric Entry'].includes(f))
    };
  }, [property]);

  const survivalMatrix = useMemo(() => [
    { label: 'Caffeine Node', value: '0.2km', icon: Cup, desc: 'Brew & Bites' },
    { label: 'Medical Pulse', value: '1.4km', icon: Stethoscope, desc: 'City Hospital' },
    { label: 'Transit Link', value: '0.5km', icon: Bus, desc: 'Sector 5 Bus Stop' },
  ], []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full" />
    </div>
  );

  // SAFE RENDER FALLBACK
  if (!property) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <h1 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter uppercase">Node Missing</h1>
      <p className="text-slate-400 font-bold mb-8">This property asset could not be located in the current cluster.</p>
      <Link to="/" className="bg-slate-900 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs">Return to Hub</Link>
    </div>
  );

  const sortedMatrix = [...(property.InstituteDistanceMatrix || [])].sort((a, b) => a.distance - b.distance);

  return (
    <div className="bg-white min-h-screen pb-32 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* Immersive Gallery */}
      <section className="relative h-[60vh] lg:h-[85vh] overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-12 gap-1 lg:gap-2">
           <div className="lg:col-span-8 h-full relative group">
              <img src={property.PhotoMain || 'https://images.unsplash.com/photo-1512917774-50ad913ee29a'} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Main" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
           </div>
           <div className="hidden lg:grid lg:col-span-4 grid-rows-2 gap-2 h-full">
              <img src={property.PhotoRoom || 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c'} className="w-full h-full object-cover" alt="Room" />
              <div className="relative overflow-hidden group">
                 <img src={property.PhotoWashroom || 'https://images.unsplash.com/photo-1584622650-61f8c508fe54'} className="w-full h-full object-cover" alt="Washroom" />
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white font-black uppercase text-[10px] tracking-widest">Inspect All Media</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Overlay Navigation */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-start pointer-events-none">
           <Link to="/" className="pointer-events-auto bg-white/20 backdrop-blur-xl p-4 rounded-2xl border border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all shadow-2xl">
              <ArrowLeft size={20} />
           </Link>
           <div className="flex gap-3 pointer-events-auto">
              <button onClick={() => setIsSaved(!isSaved)} className={`p-4 rounded-2xl border backdrop-blur-xl transition-all shadow-2xl ${isSaved ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white/20 border-white/20 text-white hover:bg-white hover:text-slate-900'}`}>
                 <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
              </button>
              <button className="bg-white/20 backdrop-blur-xl p-4 rounded-2xl border border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all shadow-2xl">
                 <Share2 size={20} />
              </button>
           </div>
        </div>

        <div className="absolute bottom-12 left-12 right-12 text-white pointer-events-none">
           <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-end gap-10">
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${property.Gender === Gender.Boys ? 'bg-blue-600' : 'bg-pink-600'}`}>
                      {property.Gender || 'UNISEX'} ONLY
                    </span>
                    <span className="bg-green-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2"><CheckCircle2 size={12} /> VERIFIED ASSET</span>
                 </div>
                 <h1 className="text-5xl lg:text-8xl font-black tracking-tighter leading-none">{property.ListingName || 'Elite Property'}</h1>
                 <div className="flex items-center gap-3 text-white/80 font-bold">
                    <MapPin size={20} className="text-indigo-400" />
                    <span className="text-lg lg:text-xl">{property.FullAddress || 'Address details in Kota'}</span>
                 </div>
              </div>
           </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 lg:px-12 mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-24">
             {/* Bento Infrastructure */}
             <section className="space-y-12">
                <div className="flex items-center gap-6">
                   <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Infrastructure</h2>
                   <div className="h-px flex-grow bg-slate-100"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-slate-50 border border-slate-100 p-8 rounded-[48px] space-y-8 hover:bg-white hover:shadow-xl transition-all duration-500">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Sparkles size={20} /></div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Premium Comfort</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         {categorizedFacilities.comfort.length > 0 ? categorizedFacilities.comfort.map(f => (
                           <div key={f} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                              {React.createElement(facilityIconMap[f] || Star, { size: 16, className: "text-indigo-600 flex-shrink-0" })}
                              <span className="text-[10px] font-black text-slate-900 uppercase truncate">{f}</span>
                           </div>
                         )) : <p className="text-[10px] text-slate-300 font-bold uppercase p-4">Standard Protocol Active</p>}
                      </div>
                   </div>

                   <div className="bg-slate-50 border border-slate-100 p-8 rounded-[48px] space-y-8 hover:bg-white hover:shadow-xl transition-all duration-500">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg"><Zap size={20} /></div>
                        <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Academic Utility</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         {categorizedFacilities.essential.length > 0 ? categorizedFacilities.essential.map(f => (
                           <div key={f} className="flex items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                              {React.createElement(facilityIconMap[f] || Star, { size: 16, className: "text-indigo-600 flex-shrink-0" })}
                              <span className="text-[10px] font-black text-slate-900 uppercase truncate">{f}</span>
                           </div>
                         )) : <p className="text-[10px] text-slate-300 font-bold uppercase p-4">Academic Basics Only</p>}
                      </div>
                   </div>
                </div>

                <div className="bg-slate-900 text-white p-10 rounded-[48px] flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-2xl">
                   <div className="flex items-center gap-6 relative z-10">
                      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400 border border-white/10"><Safety size={28} /></div>
                      <div>
                         <p className="text-3xl font-black tracking-tighter uppercase">Security Protocol</p>
                         <p className="text-[10px] font-black uppercase text-white/30 tracking-widest">Scholar Guard v2.5</p>
                      </div>
                   </div>
                   <div className="flex flex-wrap gap-4 justify-center relative z-10">
                      {categorizedFacilities.safety.length > 0 ? categorizedFacilities.safety.map(f => (
                        <div key={f} className="px-8 py-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4">
                           <CheckCircle2 size={16} className="text-indigo-400" />
                           <span className="text-[11px] font-black uppercase tracking-widest">{f}</span>
                        </div>
                      )) : <p className="text-[10px] text-white/20 font-black uppercase">Standard Wardened Node</p>}
                   </div>
                </div>
             </section>

             {/* Financials */}
             <section className="bg-white border border-slate-200 rounded-[56px] p-12 lg:p-16 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                   <div>
                      <h2 className="text-5xl font-black tracking-tighter uppercase mb-2 text-slate-900">Budget Matrix</h2>
                      <p className="text-slate-400 font-bold text-lg">Full financial transparency protocol.</p>
                   </div>
                   <div className="flex p-2 bg-slate-50 rounded-[28px] border border-slate-100">
                      <button onClick={() => setActiveRentType('Single')} className={`px-10 py-4 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all ${activeRentType === 'Single' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}>Single</button>
                      <button onClick={() => setActiveRentType('Double')} className={`px-10 py-4 rounded-[22px] text-[11px] font-black uppercase tracking-widest transition-all ${activeRentType === 'Double' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400'}`}>Double</button>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                   <div className="lg:col-span-7 space-y-4">
                      <p className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600 ml-2">Net Monthly Rental</p>
                      <div className="flex items-baseline gap-4">
                         <span className="text-3xl font-black text-slate-200">₹</span>
                         <span className="text-8xl lg:text-9xl font-black tracking-tighter text-slate-900">
                           {activeRentType === 'Single' ? (property.RentSingle || 0).toLocaleString() : (property.RentDouble || 0).toLocaleString()}
                         </span>
                         <span className="text-2xl font-bold text-slate-300">/mo</span>
                      </div>
                   </div>
                   <div className="lg:col-span-5 grid grid-cols-2 gap-6">
                      {[
                        { label: 'Electricity', val: `₹${property.ElectricityCharges || 0}`, unit: '/Unit' },
                        { label: 'Parent Stay', val: `₹${property.ParentsStayCharge || 0}`, unit: '/Day' },
                        { label: 'Security', val: '1 Month', unit: 'Deposit' },
                        { label: 'Maintenance', val: `₹${property.Maintenance || 0}`, unit: 'Annual' },
                      ].map((fee, i) => (
                        <div key={i} className="bg-slate-50 border border-slate-100 p-6 rounded-[32px] group hover:border-indigo-600 transition-colors">
                           <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">{fee.label}</p>
                           <p className="text-xl font-black text-slate-900">{fee.val}<span className="text-[10px] ml-1 opacity-30 font-bold">{fee.unit}</span></p>
                        </div>
                      ))}
                   </div>
                </div>
             </section>
          </div>

          {/* Sticky Sidebar */}
          <aside className="lg:col-span-4">
             <div className="lg:sticky lg:top-28 space-y-10">
                <div className="bg-white border border-slate-100 rounded-[56px] p-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12"><LayoutGrid size={120} /></div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-10">Host Identity</p>
                   
                   <div className="flex items-center gap-6 mb-12">
                      <div className="w-20 h-20 rounded-[32px] bg-slate-900 text-white flex items-center justify-center text-3xl font-black shadow-2xl">{property.OwnerName?.[0] || 'O'}</div>
                      <div>
                         <p className="text-2xl font-black text-slate-900">{property.OwnerName || 'Verified Host'}</p>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Asset Manager</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <a href={`https://wa.me/${property.OwnerWhatsApp || '919876543210'}`} className="w-full h-20 bg-green-500 text-white rounded-[28px] flex items-center justify-center gap-4 font-black uppercase tracking-widest text-xs shadow-xl shadow-green-100 hover:scale-[1.02] transition-all">
                         <MessageCircle size={22} /> Transmit Message
                      </a>
                      <a href={`tel:${property.OwnerWhatsApp || '919876543210'}`} className="w-full h-20 bg-slate-900 text-white rounded-[28px] flex items-center justify-center gap-4 font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 hover:scale-[1.02] transition-all">
                         <Phone size={22} /> Instant Callback
                      </a>
                   </div>
                </div>

                <div className="bg-indigo-600 text-white rounded-[56px] p-12 shadow-2xl relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-indigo-800 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                   <div className="relative z-10">
                      <div className="flex items-center gap-5 mb-10">
                         <div className="w-16 h-16 bg-white/10 rounded-3xl flex items-center justify-center text-4xl">👮</div>
                         <div>
                            <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">On-Site Guardian</p>
                            <p className="text-2xl font-black leading-none">{property.WardenName || 'Node Warden'}</p>
                         </div>
                      </div>
                      <div className="bg-white/10 border border-white/10 p-8 rounded-[40px] text-center">
                         <p className="text-[11px] font-black uppercase text-indigo-200 mb-3 flex items-center justify-center gap-2 tracking-[0.2em]"><ShieldAlert size={16} /> Emergency Link</p>
                         <p className="text-3xl font-black font-mono tracking-widest">{property.EmergencyContact || '91911'}</p>
                      </div>
                   </div>
                </div>
             </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default PropertyProfile;
