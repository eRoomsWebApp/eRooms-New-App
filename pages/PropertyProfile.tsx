
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useSpring } from 'framer-motion';
import { 
  Wind, Wifi, Utensils, WashingMachine, Cctv, Droplet, 
  Zap, Bath, BookOpen, Shirt, Sun, Star, MapPin, 
  Phone, Mail, ShieldCheck, Video, Info, CreditCard, 
  User, ShieldAlert, MessageCircle, ExternalLink,
  ChevronRight, Calendar, Sparkles, Map as MapIcon,
  Heart, Share2, Navigation, Coffee, Stethoscope, Bus,
  CheckCircle2, AlertTriangle, ArrowLeft, MoreHorizontal,
  LayoutGrid, Shield as Safety, Monitor, Coffee as Cup,
  ArrowRight, Eye, MousePointer2
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
  const [activeSection, setActiveSection] = useState('overview');

  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  const sectionRefs = {
    overview: useRef<HTMLDivElement>(null),
    infrastructure: useRef<HTMLDivElement>(null),
    budget: useRef<HTMLDivElement>(null),
    proximity: useRef<HTMLDivElement>(null),
    management: useRef<HTMLDivElement>(null),
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    
    const handleScroll = () => {
      const scrollPos = window.scrollY + 200;
      for (const [key, ref] of Object.entries(sectionRefs)) {
        if (ref.current && scrollPos >= ref.current.offsetTop && scrollPos < ref.current.offsetTop + ref.current.offsetHeight) {
          setActiveSection(key);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offset = 120;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const survivalMatrix = useMemo(() => [
    { label: 'Caffeine Node', value: '0.2km', icon: Cup, desc: 'Brew & Bites' },
    { label: 'Medical Pulse', value: '1.4km', icon: Stethoscope, desc: 'City Hospital' },
    { label: 'Transit Link', value: '0.5km', icon: Bus, desc: 'Sector 5 Bus Stop' },
  ], []);

  const categorizedFacilities = useMemo(() => {
    if (!property) return { essential: [], comfort: [], safety: [] };
    return {
      essential: property.Facilities.filter(f => ['RO Water', 'Mess Facility', 'Study Table', 'Wardrobe'].includes(f)),
      comfort: property.Facilities.filter(f => ['AC', 'WiFi', 'Laundry', 'Geyser', 'Balcony', 'Attached Washroom'].includes(f)),
      safety: property.Facilities.filter(f => ['CCTV', 'Biometric Entry'].includes(f))
    };
  }, [property]);

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

  const navLinks = [
    { id: 'overview', label: 'Overview' },
    { id: 'infrastructure', label: 'Infrastructure' },
    { id: 'budget', label: 'Pricing' },
    { id: 'proximity', label: 'Location' },
    { id: 'management', label: 'Host' },
  ];

  return (
    <div className="bg-white min-h-screen pb-40 lg:pb-0 scroll-smooth">
      {/* Scroll Progress Bar */}
      <motion.div className="fixed top-0 left-0 right-0 h-1 bg-indigo-600 z-[100] origin-left" style={{ scaleX }} />

      {/* 1. Immersive Hero Gallery */}
      <section id="overview" ref={sectionRefs.overview} className="relative h-[65vh] lg:h-[90vh] overflow-hidden">
        <div className="absolute inset-0 grid grid-cols-1 lg:grid-cols-12 gap-1 lg:gap-2">
           <div className="lg:col-span-8 h-full relative group">
              <img src={property.PhotoMain} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt="Main" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/10 to-transparent"></div>
           </div>
           <div className="hidden lg:grid lg:col-span-4 grid-rows-2 gap-2 h-full">
              <div className="relative overflow-hidden group">
                 <img src={property.PhotoRoom} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Room" />
                 <div className="absolute inset-0 bg-black/20"></div>
              </div>
              <div className="relative overflow-hidden group">
                 <img src={property.PhotoWashroom} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt="Washroom" />
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="text-white font-black uppercase text-xs tracking-widest border border-white/40 px-6 py-3 rounded-xl backdrop-blur-md">View All 18 Photos</span>
                 </div>
              </div>
           </div>
        </div>

        {/* Hero Header Controls */}
        <div className="absolute top-8 left-8 right-8 flex justify-between items-start pointer-events-none z-20">
           <Link to="/" className="pointer-events-auto bg-white/10 backdrop-blur-2xl p-4 rounded-2xl border border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all shadow-2xl">
              <ArrowLeft size={20} />
           </Link>
           <div className="flex gap-3 pointer-events-auto">
              <button onClick={() => setIsSaved(!isSaved)} className={`p-4 rounded-2xl border backdrop-blur-xl transition-all shadow-2xl ${isSaved ? 'bg-rose-500 border-rose-500 text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white hover:text-slate-900'}`}>
                 <Heart size={20} fill={isSaved ? "currentColor" : "none"} />
              </button>
              <button className="bg-white/10 backdrop-blur-2xl p-4 rounded-2xl border border-white/20 text-white hover:bg-white hover:text-slate-900 transition-all shadow-2xl">
                 <Share2 size={20} />
              </button>
           </div>
        </div>

        <div className="absolute bottom-16 left-8 lg:left-16 right-8 lg:right-16 text-white pointer-events-none z-20">
           <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-end gap-10">
              <div className="space-y-6">
                 <motion.div 
                   initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                   className="flex flex-wrap items-center gap-4"
                 >
                    <span className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${property.Gender === Gender.Boys ? 'bg-blue-600' : 'bg-pink-600'}`}>{property.Gender} EXCLUSIVE</span>
                    <span className="bg-emerald-500/90 backdrop-blur-md px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2"><CheckCircle2 size={12} /> VERIFIED PROPERTY</span>
                    <span className="bg-white/10 backdrop-blur-md px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg flex items-center gap-2 text-indigo-400">#KOTA-ELITE-7492</span>
                 </motion.div>
                 <motion.h1 
                   initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                   className="text-6xl lg:text-[120px] font-black tracking-tighter leading-[0.85] uppercase"
                 >
                    {property.ListingName}
                 </motion.h1>
                 <div className="flex flex-wrap items-center gap-6 text-white/70 font-bold">
                    <div className="flex items-center gap-3">
                      <MapPin size={22} className="text-indigo-400" />
                      <span className="text-lg lg:text-2xl">{property.Area}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
                      <Eye size={18} />
                      <span className="text-sm font-black uppercase tracking-widest">14 Scholars Viewing</span>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* 2. Sticky Navigation Bar */}
      <nav className="sticky top-20 z-[80] bg-white border-b border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto px-4 lg:px-12 flex items-center justify-between">
          <div className="flex gap-8">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => scrollToSection(link.id)}
                className={`py-6 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${
                  activeSection === link.id ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-900'
                }`}
              >
                {link.label}
                {activeSection === link.id && (
                  <motion.div layoutId="activeNav" className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
          <div className="hidden lg:flex items-center gap-8 py-4">
             <div className="text-right">
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Starting at</p>
                <p className="text-xl font-black text-slate-900 leading-none">₹{property.RentDouble.toLocaleString()}<span className="text-[10px] font-bold text-slate-400">/mo</span></p>
             </div>
             <button onClick={() => scrollToSection('management')} className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-indigo-600 transition-all active:scale-95">Book Free Visit</button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 lg:px-12 mt-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-20 lg:gap-32">
          
          {/* Main Info Stream */}
          <div className="lg:col-span-8 space-y-32">
             
             {/* Infrastructure Section */}
             <section id="infrastructure" ref={sectionRefs.infrastructure} className="space-y-16">
                <div className="flex flex-col gap-4">
                   <p className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600">Core Assets</p>
                   <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Elite Infrastructure</h2>
                   <p className="text-slate-400 font-bold max-w-xl text-lg leading-relaxed">
                     Purpose-built student habitat designed for academic excellence and mental well-being.
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   {/* Comfort & Tech */}
                   <div className="bg-slate-50 border border-slate-100 p-10 rounded-[56px] space-y-10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-700"><Sparkles size={100} /></div>
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100"><Sparkles size={24} /></div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Premium Comfort</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                         {categorizedFacilities.comfort.map(f => {
                           const Icon = facilityIconMap[f] || Star;
                           return (
                             <div key={f} className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 group/item hover:border-indigo-600 transition-all">
                                <div className="flex items-center gap-4">
                                  <div className="p-3 bg-slate-50 rounded-xl group-hover/item:bg-indigo-50 group-hover/item:text-indigo-600 transition-colors">
                                    <Icon size={20} className="flex-shrink-0" />
                                  </div>
                                  <span className="text-[13px] font-black text-slate-900 uppercase tracking-widest">{f}</span>
                                </div>
                                <CheckCircle2 size={16} className="text-indigo-600 opacity-20 group-hover/item:opacity-100" />
                             </div>
                           )
                         })}
                      </div>
                   </div>

                   {/* Academic Utility */}
                   <div className="bg-slate-50 border border-slate-100 p-10 rounded-[56px] space-y-10 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-700"><BookOpen size={100} /></div>
                      <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-slate-100"><BookOpen size={24} /></div>
                        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">Academic Utility</h3>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                         {categorizedFacilities.essential.map(f => {
                           const Icon = facilityIconMap[f] || Star;
                           return (
                             <div key={f} className="flex items-center justify-between bg-white p-6 rounded-3xl border border-slate-100 group/item hover:border-indigo-600 transition-all">
                                <div className="flex items-center gap-4">
                                   <div className="p-3 bg-slate-50 rounded-xl group-hover/item:bg-indigo-50 group-hover/item:text-indigo-600 transition-colors">
                                      <Icon size={20} className="flex-shrink-0" />
                                   </div>
                                   <span className="text-[13px] font-black text-slate-900 uppercase tracking-widest">{f}</span>
                                </div>
                                <CheckCircle2 size={16} className="text-indigo-600 opacity-20 group-hover/item:opacity-100" />
                             </div>
                           )
                         })}
                      </div>
                   </div>
                </div>

                {/* Security Protocol Block */}
                <div className="bg-slate-900 text-white p-12 lg:p-16 rounded-[64px] flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-16 opacity-5 -rotate-12 group-hover:rotate-0 transition-transform duration-1000"><Safety size={200} /></div>
                   <div className="flex items-center gap-8 relative z-10">
                      <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-indigo-400 border border-white/10 shadow-2xl"><Safety size={40} /></div>
                      <div>
                         <p className="text-4xl font-black tracking-tighter uppercase mb-1">Safety Core</p>
                         <p className="text-[11px] font-black uppercase text-white/30 tracking-[0.4em]">Integrated Sentinel System</p>
                      </div>
                   </div>
                   <div className="flex flex-wrap gap-4 justify-center relative z-10">
                      {categorizedFacilities.safety.map(f => (
                        <div key={f} className="px-8 py-4 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4 hover:bg-white hover:text-slate-900 transition-all group/pill">
                           <CheckCircle2 size={18} className="text-indigo-400 group-hover/pill:text-slate-900" />
                           <span className="text-[12px] font-black uppercase tracking-widest">{f}</span>
                        </div>
                      ))}
                   </div>
                </div>
             </section>

             {/* Budget Section */}
             <section id="budget" ref={sectionRefs.budget} className="bg-slate-50 border border-slate-200 rounded-[72px] p-12 lg:p-20 shadow-sm relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-80 h-80 bg-indigo-100 rounded-full blur-[100px] opacity-40"></div>
                <div className="relative z-10">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-20">
                      <div className="space-y-4">
                        <p className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600">Financial Protocol</p>
                        <h2 className="text-5xl lg:text-6xl font-black tracking-tighter uppercase mb-2 text-slate-900">Budget Matrix</h2>
                        <p className="text-slate-400 font-bold text-lg">Platform-verified fixed pricing. No hidden overheads.</p>
                      </div>
                      <div className="flex p-2 bg-white rounded-3xl border border-slate-200 shadow-sm">
                        <button onClick={() => setActiveRentType('Single')} className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeRentType === 'Single' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>Single Stay</button>
                        <button onClick={() => setActiveRentType('Double')} className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${activeRentType === 'Double' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-900'}`}>Shared Stay</button>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
                      <div className="lg:col-span-7 space-y-4">
                         <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-black text-slate-200">₹</span>
                            <span className="text-9xl lg:text-[140px] font-black tracking-tighter text-slate-900 leading-none">{activeRentType === 'Single' ? property.RentSingle.toLocaleString() : property.RentDouble.toLocaleString()}</span>
                            <span className="text-2xl font-bold text-slate-300">/mo</span>
                         </div>
                         <div className="flex items-center gap-4 bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl border border-emerald-100 w-fit">
                            <Zap size={16} />
                            <span className="text-[11px] font-black uppercase tracking-widest">Fixed Pricing: No Brokerage Applied</span>
                         </div>
                      </div>
                      <div className="lg:col-span-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                         {[
                           { label: 'Electricity', val: `₹${property.ElectricityCharges}`, unit: '/Unit' },
                           { label: 'Parent Stay', val: `₹${property.ParentsStayCharge}`, unit: '/Day' },
                           { label: 'Security', val: '1 Month', unit: 'Refundable' },
                           { label: 'Annual Maintenance', val: `₹${property.Maintenance}`, unit: 'Audit Fee' },
                         ].map((fee, i) => (
                           <div key={i} className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm hover:translate-y-[-4px] transition-all">
                              <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest mb-2">{fee.label}</p>
                              <p className="text-2xl font-black text-slate-900 tracking-tight">{fee.val}<span className="text-[10px] ml-1 opacity-20 font-bold uppercase">{fee.unit}</span></p>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="mt-20 p-8 bg-slate-900 text-white rounded-[40px] flex flex-col md:flex-row items-center justify-between gap-8 border border-white/5 shadow-2xl">
                      <div className="flex items-center gap-6">
                         <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-indigo-400"><ShieldCheck size={32} /></div>
                         <div>
                            <p className="text-xl font-black tracking-tight leading-none mb-1">Elite Security Terms</p>
                            <p className="text-xs font-bold text-white/40">{property.SecurityTerms}</p>
                         </div>
                      </div>
                      <button className="bg-white text-slate-900 px-10 py-5 rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-indigo-600 hover:text-white transition-all">Download Contract Template</button>
                   </div>
                </div>
             </section>

             {/* Location Section */}
             <section id="proximity" ref={sectionRefs.proximity} className="space-y-16">
                <div className="flex flex-col gap-4">
                   <p className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-600">Geographic Context</p>
                   <h2 className="text-5xl font-black text-slate-900 uppercase tracking-tighter">Location Intel</h2>
                   <p className="text-slate-400 font-bold max-w-xl text-lg leading-relaxed">
                     Strategically anchored in the {property.Area} cluster for minimal commute and maximum productivity.
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                   <div className="space-y-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3"><Navigation size={22} className="text-indigo-600" /> Institute Pulse</h3>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Normalized Commute</span>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-[56px] overflow-hidden shadow-sm">
                         {sortedMatrix.slice(0, 5).map((item, i) => (
                           <div key={i} className="p-8 border-b border-slate-50 flex items-center justify-between hover:bg-slate-50 transition-colors group cursor-default">
                              <div className="flex items-center gap-6">
                                 <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center font-black text-xs text-slate-300 group-hover:bg-slate-900 group-hover:text-white transition-all">{i+1}</div>
                                 <div>
                                   <p className="font-black text-slate-900 text-lg tracking-tight">{item.name}</p>
                                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Coaching Node</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-2xl font-black text-slate-900 tracking-tighter">{item.distance} <span className="text-[10px]">KM</span></p>
                                 <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">🚶 {Math.ceil(item.distance * 12)}M WALK</p>
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>

                   <div className="space-y-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-3"><MapIcon size={22} className="text-indigo-600" /> Ecosystem Hub</h3>
                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Essential Nodes</span>
                      </div>
                      <div className="grid grid-cols-1 gap-6">
                         {survivalMatrix.map((node, i) => (
                           <div key={i} className="p-8 bg-slate-50 border border-slate-100 rounded-[48px] flex items-center gap-8 group hover:border-indigo-600 transition-all hover:bg-white hover:shadow-xl">
                              <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center justify-center text-indigo-600 group-hover:rotate-12 transition-transform border border-slate-50">
                                 <node.icon size={28} />
                              </div>
                              <div>
                                 <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-1">{node.label}</p>
                                 <p className="text-xl font-black text-slate-900 tracking-tight">{node.desc} <span className="text-indigo-600 ml-2 font-mono text-sm opacity-60">[{node.value}]</span></p>
                              </div>
                              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight size={20} className="text-slate-300" />
                              </div>
                           </div>
                         ))}
                         <div className="mt-6 p-8 bg-slate-900 rounded-[48px] text-white flex items-center justify-between shadow-2xl group cursor-pointer hover:bg-indigo-600 transition-colors">
                            <div className="flex items-center gap-4">
                              <Navigation size={24} className="text-indigo-400 group-hover:text-white" />
                              <p className="text-sm font-black uppercase tracking-widest">View on Satellite Map</p>
                            </div>
                            <ExternalLink size={18} className="opacity-40" />
                         </div>
                      </div>
                   </div>
                </div>
             </section>
          </div>

          {/* Sticky Conversion Sidebar */}
          <aside id="management" ref={sectionRefs.management} className="lg:col-span-4">
             <div className="lg:sticky lg:top-40 space-y-10">
                
                {/* 5. Booking Card */}
                <div className="bg-white border border-slate-100 rounded-[64px] p-10 lg:p-12 shadow-[0_40px_80px_-16px_rgba(0,0,0,0.12)] relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-12 opacity-[0.03] -rotate-12 group-hover:rotate-0 transition-transform duration-1000 select-none"><LayoutGrid size={240} /></div>
                   <div className="flex justify-between items-center mb-12 relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-300">Management Dossier</p>
                      <span className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest"><ShieldCheck size={14} /> Elite Verified</span>
                   </div>
                   
                   <div className="flex items-center gap-6 mb-16 relative z-10">
                      <div className="w-20 h-20 rounded-[32px] bg-slate-900 text-white flex items-center justify-center text-3xl font-black shadow-2xl border-4 border-white">{property.OwnerName[0]}</div>
                      <div>
                         <p className="text-2xl font-black text-slate-900 tracking-tighter leading-none mb-2">{property.OwnerName}</p>
                         <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Direct Host Contact</p>
                         </div>
                      </div>
                   </div>

                   <div className="space-y-4 relative z-10">
                      <div className="p-8 bg-slate-50 border border-slate-100 rounded-[40px] mb-8">
                         <div className="flex justify-between items-end mb-6">
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Best Rental Rate</p>
                            <p className="text-[10px] font-black text-indigo-600 uppercase">Per Session</p>
                         </div>
                         <div className="flex items-baseline gap-2">
                            <span className="text-xl font-black text-slate-300">₹</span>
                            <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{property.RentDouble.toLocaleString()}</span>
                            <span className="text-sm font-bold text-slate-400">/mo</span>
                         </div>
                      </div>

                      <button onClick={() => window.open(`https://wa.me/${property.OwnerWhatsApp}`, '_blank')} className="w-full h-24 bg-indigo-600 text-white rounded-[32px] flex items-center justify-between px-10 font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-indigo-100 hover:scale-[1.03] active:scale-95 transition-all group">
                         <div className="flex items-center gap-4">
                           <Calendar size={20} className="group-hover:rotate-12 transition-transform" />
                           <span>Schedule Free Visit</span>
                         </div>
                         <ArrowRight size={20} />
                      </button>
                      <div className="grid grid-cols-2 gap-4">
                        <a href={`tel:${property.OwnerWhatsApp}`} className="h-20 bg-slate-900 text-white rounded-[32px] flex items-center justify-center gap-4 font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-slate-800 transition-all">
                           <Phone size={18} /> Call Hub
                        </a>
                        <button className="h-20 bg-slate-50 text-slate-400 border border-slate-100 rounded-[32px] flex items-center justify-center gap-4 font-black uppercase tracking-widest text-[10px] hover:bg-white hover:text-slate-900 transition-all">
                           <Share2 size={18} /> Share
                        </button>
                      </div>
                   </div>

                   <div className="mt-12 pt-10 border-t border-slate-50 text-center relative z-10">
                      <p className="text-[10px] font-bold text-slate-300 leading-relaxed px-10">Direct communication via Atlas protocol ensures 0% brokerage and verified asset availability.</p>
                   </div>
                </div>

                {/* Safety Protocol Sidebar */}
                <div className="bg-indigo-600 text-white rounded-[64px] p-12 shadow-2xl relative overflow-hidden group">
                   <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-[120px] group-hover:scale-125 transition-transform duration-1000"></div>
                   <div className="flex items-center gap-6 mb-12 relative z-10">
                      <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center text-3xl shadow-xl border border-white/10">👮</div>
                      <div>
                         <p className="text-[10px] font-black uppercase text-indigo-200 tracking-[0.4em] mb-1">Guardian Terminal</p>
                         <p className="text-3xl font-black leading-none tracking-tighter">{property.WardenName}</p>
                      </div>
                   </div>
                   <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-[40px] text-center relative z-10 shadow-2xl">
                      <p className="text-[11px] font-black uppercase text-indigo-100 mb-3 flex items-center justify-center gap-3"><ShieldAlert size={16} /> 24/7 Security Hotline</p>
                      <p className="text-3xl font-black font-mono tracking-widest text-white/95">{property.EmergencyContact}</p>
                   </div>
                   <p className="text-[10px] text-indigo-100/40 text-center font-bold mt-8 relative z-10 uppercase tracking-widest">Mandatory Node Presence for Scholars</p>
                </div>

             </div>
          </aside>

        </div>
      </div>

      {/* 6. Mobile Floating Action Bar - Optimized for Conversion */}
      <div className="fixed bottom-8 left-6 right-6 lg:hidden z-[90]">
         <div className="bg-slate-900/95 backdrop-blur-3xl rounded-[40px] p-3 flex items-center gap-3 border border-white/10 shadow-[0_40px_80px_-16px_rgba(0,0,0,0.5)]">
            <div className="px-6 border-r border-white/10">
                <p className="text-[9px] font-black uppercase text-white/40 tracking-widest mb-1">Rent</p>
                <p className="text-xl font-black text-white leading-none">₹{property.RentDouble.toLocaleString()}</p>
            </div>
            <button onClick={() => window.open(`https://wa.me/${property.OwnerWhatsApp}`, '_blank')} className="flex-grow h-16 bg-indigo-600 text-white rounded-[32px] flex items-center justify-center gap-4 font-black uppercase tracking-widest text-[11px] shadow-xl">
               <MousePointer2 size={18} /> Book Free Visit
            </button>
            <a href={`tel:${property.OwnerWhatsApp}`} className="w-16 h-16 bg-white text-slate-900 rounded-[32px] flex items-center justify-center shadow-lg transition-transform active:scale-90">
               <Phone size={22} />
            </a>
         </div>
      </div>

    </div>
  );
};

export default PropertyProfile;
