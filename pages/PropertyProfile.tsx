import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wind, Wifi, Utensils, WashingMachine, Cctv, Droplet, 
  Zap, Bath, BookOpen, Shirt, Sun, Star, MapPin, 
  Phone, Mail, ShieldCheck, Video, Info, CreditCard, 
  User, ShieldAlert, MessageCircle, ExternalLink,
  ChevronRight, Calendar, Sparkles, Map as MapIcon,
  Heart, Share2, Navigation, Coffee, Stethoscope, Bus,
  CheckCircle2, AlertTriangle, ArrowLeft, MoreHorizontal,
  LayoutGrid
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
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Student Survival Insights (Mock data derived from property location)
  const survivalMatrix = useMemo(() => [
    { label: 'Caffeine Node', value: '0.2km', icon: Coffee, desc: 'Brew & Bites' },
    { label: 'Medical Pulse', value: '1.4km', icon: Stethoscope, desc: 'City Hospital' },
    { label: 'Transit Link', value: '0.5km', icon: Bus, desc: 'Sector 5 Bus Stop' },
  ], []);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full" />
    </div>
  );

  if (!property) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-4">
      <h1 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tighter">Asset Not Located</h1>
      <Link to="/" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black">Return to Hub</Link>
    </div>
  );

  const sortedMatrix = [...(property.InstituteDistanceMatrix || [])].sort((a, b) => a.distance - b.distance);

  return (
    <div className="bg-white min-h-screen pb-32">
      
      {/* 1. Immersive Hero Gallery */}
      <section className="relative h-[60vh] lg:h-[85vh] overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-12 gap-1 lg:gap-2">
           <div className="lg:col-span-8 h-full relative group">
              <img src={property.PhotoMain} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Main" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent"></div>
           </div>
           <div className="hidden lg:grid lg:col-span-4 grid-rows-2 gap-2 h-full">
              <div className="relative overflow-hidden group">
                 <img src={property.PhotoRoom} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Room" />
              </div>
              <div className="relative overflow-hidden group">
                 <img src={property.PhotoWashroom} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Washroom" />
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="text-white font-black uppercase text-xs tracking-widest">+12 More Photos</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Hero Overlay Controls */}
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
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${property.Gender === Gender.Boys ? 'bg-blue-600' : 'bg-pink-600'}`}>{property.Gender} ONLY</span>
                    <span className="bg-green-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2"><CheckCircle2 size={12} /> VERIFIED ASSET</span>
                 </div>
                 <h1 className="text-5xl lg:text-8xl font-black tracking-tighter leading-none">{property.ListingName}</h1>
                 <div className="flex items-center gap-3 text-white/80 font-bold">
                    <MapPin size={20} className="text-indigo-400" />
                    <span className="text-lg lg:text-xl">{property.FullAddress}</span>
                 </div>
              </div>
           </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 lg:px-12 mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
          
          {/* Main Info Stream */}
          <div className="lg:col-span-8 space-y-24">
             
             {/* 2. Elite Amenities Grid */}
             <section className="space-y-10">
                <div className="flex items-center gap-6">
                   <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Elite Amenities</h2>
                   <div className="h-px flex-grow bg-slate-100"></div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {property.Facilities.map(f => {
                     const Icon = facilityIconMap[f] || Star;
                     return (
                       <div key={f} className="bg-slate-50 border border-slate-100 p-6 rounded-[32px] flex flex-col items-center text-center group hover:bg-slate-900 transition-all duration-500">
                          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-indigo-600 mb-4 group-hover:scale-110 transition-transform">
                             <Icon size={24} />
                          </div>
                          <span className="text-[11px] font-black uppercase text-slate-500 group-hover:text-white tracking-widest">{f}</span>
                       </div>
                     );
                   })}
                </div>
             </section>

             {/* 3. Budget Matrix & Transparency */}
             <section className="bg-slate-900 text-white rounded-[56px] p-10 lg:p-16 shadow-2xl relative overflow-hidden">
                <Sparkles className="absolute -top-10 -right-10 w-64 h-64 text-white/5 rotate-12" />
                <div className="relative z-10">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                      <div>
                        <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase mb-2">Budget Protocol</h2>
                        <p className="text-white/40 font-bold">Full financial transparency for the scholar session.</p>
                      </div>
                      <div className="flex p-1.5 bg-white/10 rounded-2xl border border-white/5">
                        <button onClick={() => setActiveRentType('Single')} className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRentType === 'Single' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40 hover:text-white'}`}>Single</button>
                        <button onClick={() => setActiveRentType('Double')} className={`px-8 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeRentType === 'Double' ? 'bg-white text-slate-900 shadow-xl' : 'text-white/40 hover:text-white'}`}>Double</button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-end">
                      <div className="space-y-2">
                         <p className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Net Monthly Rental</p>
                         <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-white/20">₹</span>
                            <span className="text-8xl lg:text-9xl font-black tracking-tighter">{activeRentType === 'Single' ? property.RentSingle.toLocaleString() : property.RentDouble.toLocaleString()}</span>
                            <span className="text-xl font-bold text-white/20">/mo</span>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                         {[
                           { label: 'Electricity', val: `₹${property.ElectricityCharges}`, unit: '/Unit' },
                           { label: 'Parent Stay', val: `₹${property.ParentsStayCharge}`, unit: '/Day' },
                           { label: 'Security', val: '1 Month', unit: 'Refundable' },
                           { label: 'Maintenance', val: `₹${property.Maintenance}`, unit: 'Annual' },
                         ].map((fee, i) => (
                           <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-[32px] group hover:bg-white/10 transition-colors">
                              <p className="text-[9px] font-black uppercase text-white/30 tracking-widest mb-1">{fee.label}</p>
                              <p className="text-xl font-black">{fee.val}<span className="text-[10px] ml-1 opacity-20 font-bold">{fee.unit}</span></p>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </section>

             {/* 4. Proximity & Survival Guide */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <section className="space-y-8">
                   <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3"><Navigation size={20} className="text-indigo-600" /> Coaching Proximity</h3>
                   <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm">
                      {sortedMatrix.map((item, i) => (
                        <div key={i} className="p-6 border-b border-slate-50 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                           <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-black text-[10px] text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">{i+1}</div>
                              <p className="font-black text-slate-900 text-sm">{item.name}</p>
                           </div>
                           <div className="text-right">
                              <p className="font-black text-slate-900">{item.distance} KM</p>
                              <p className="text-[10px] font-black text-green-500 uppercase">~{Math.ceil(item.distance * 12)}m walk</p>
                           </div>
                        </div>
                      ))}
                   </div>
                </section>

                <section className="space-y-8">
                   <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3"><MapIcon size={20} className="text-indigo-600" /> Survival Hub</h3>
                   <div className="grid grid-cols-1 gap-4">
                      {survivalMatrix.map((node, i) => (
                        <div key={i} className="p-6 bg-slate-50 border border-slate-100 rounded-[32px] flex items-center gap-6 group hover:border-indigo-200 transition-all">
                           <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-indigo-600 group-hover:rotate-6 transition-transform">
                              <node.icon size={24} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{node.label}</p>
                              <p className="font-black text-slate-900">{node.desc} <span className="text-indigo-600 ml-1">({node.value})</span></p>
                           </div>
                        </div>
                      ))}
                   </div>
                </section>
             </div>
          </div>

          {/* Sticky Sidebar Node */}
          <aside className="lg:col-span-4">
             <div className="lg:sticky lg:top-28 space-y-8">
                
                {/* 5. Booking Card */}
                <div className="bg-white border border-slate-100 rounded-[48px] p-8 lg:p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-8 opacity-5"><LayoutGrid size={120} /></div>
                   <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300 mb-8">Management Hub</p>
                   
                   <div className="flex items-center gap-5 mb-12">
                      <div className="w-16 h-16 rounded-[24px] bg-slate-900 text-white flex items-center justify-center text-2xl font-black shadow-xl">{property.OwnerName[0]}</div>
                      <div>
                         <p className="text-xl font-black text-slate-900">{property.OwnerName}</p>
                         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Verified Host Node</p>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <a href={`https://wa.me/${property.OwnerWhatsApp}`} className="w-full h-20 bg-green-500 text-white rounded-[24px] flex items-center justify-center gap-4 font-black uppercase tracking-widest text-xs shadow-xl shadow-green-100 hover:scale-[1.02] transition-transform">
                         <MessageCircle size={22} /> Transmit Message
                      </a>
                      <a href={`tel:${property.OwnerWhatsApp}`} className="w-full h-20 bg-slate-900 text-white rounded-[24px] flex items-center justify-center gap-4 font-black uppercase tracking-widest text-xs shadow-xl shadow-slate-200 hover:scale-[1.02] transition-transform">
                         <Phone size={22} /> Direct Contact
                      </a>
                   </div>

                   <div className="mt-10 pt-10 border-t border-slate-50 text-center">
                      <div className="flex items-center justify-center gap-2 text-indigo-600 mb-2">
                         <ShieldCheck size={16} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Trust Protocol Active</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 leading-relaxed px-6">Direct communication ensures the best price and zero management commission.</p>
                   </div>
                </div>

                {/* 6. Safety Protocol */}
                <div className="bg-indigo-600 text-white rounded-[48px] p-10 shadow-xl relative overflow-hidden">
                   <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
                   <div className="flex items-center gap-5 mb-8">
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">👮</div>
                      <div>
                         <p className="text-[10px] font-black uppercase text-white/40 tracking-[0.3em]">Guardian Node</p>
                         <p className="text-2xl font-black leading-none">{property.WardenName}</p>
                      </div>
                   </div>
                   <div className="bg-white/10 border border-white/10 p-6 rounded-[32px] text-center">
                      <p className="text-[10px] font-black uppercase text-indigo-200 mb-2 flex items-center justify-center gap-2"><ShieldAlert size={14} /> Emergency Vector</p>
                      <p className="text-2xl font-black font-mono tracking-widest">{property.EmergencyContact}</p>
                   </div>
                </div>

             </div>
          </aside>

        </div>
      </div>

      {/* Mobile Floating Action Bar */}
      <div className="fixed bottom-6 left-6 right-6 lg:hidden z-50">
         <div className="bg-slate-900/90 backdrop-blur-2xl rounded-[32px] p-2 flex items-center gap-2 border border-white/10 shadow-2xl">
            <a href={`https://wa.me/${property.OwnerWhatsApp}`} className="flex-grow h-16 bg-green-500 text-white rounded-[28px] flex items-center justify-center gap-3 font-black uppercase tracking-widest text-[10px]">
               <MessageCircle size={18} /> Chat with Host
            </a>
            <a href={`tel:${property.OwnerWhatsApp}`} className="w-16 h-16 bg-white text-slate-900 rounded-[28px] flex items-center justify-center">
               <Phone size={20} />
            </a>
         </div>
      </div>

    </div>
  );
};

export default PropertyProfile;