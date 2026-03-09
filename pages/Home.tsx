
import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useProperties } from '../context/PropertyContext';
import PropertyCard from '../components/PropertyCard';
import SearchBar from '../components/SearchBar';
import FilterBar from '../components/FilterBar';
import { ApprovalStatus, UserRole } from '../types';
import { getAppConfig, CONFIG_UPDATED_EVENT } from '../db';
import { useAuth } from '../context/AuthContext';
import { Building2, PlusCircle, ArrowRight } from 'lucide-react';
import { transformDriveUrl } from '../utils/urlHelper';

const Home: React.FC = () => {
  const { filteredProperties, properties, loading, isFiltering, setFilters } = useProperties();
  const { user } = useAuth();
  const [config, setConfig] = useState(getAppConfig());

  useEffect(() => {
    const handleSync = (e: Event) => {
      setConfig((e as CustomEvent).detail);
    };
    window.addEventListener(CONFIG_UPDATED_EVENT, handleSync);
    return () => window.removeEventListener(CONFIG_UPDATED_EVENT, handleSync);
  }, []);

  const recommendations = useMemo(() => {
    return properties
      .filter(p => p.ApprovalStatus === ApprovalStatus.Approved)
      .slice(0, 3);
  }, [properties]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full"
      />
    </div>
  );

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <div className="bg-slate-50 pt-20 pb-16 px-4 border-b border-slate-100 relative overflow-hidden">
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/50 border border-white/80 px-4 py-1.5 rounded-full mb-8 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">500+ Properties Live in Kota</span>
          </motion.div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter">{config.tagline}</h1>
          <p className="text-slate-400 font-bold text-lg mb-12 max-w-xl mx-auto leading-relaxed">{config.heroDescription}</p>
          
          <SearchBar />
        </div>
      </div>

      <FilterBar />

      <div className="max-w-7xl mx-auto px-4 mt-12">
        <div className="flex justify-between items-center mb-10">
           <div className="flex items-center gap-3">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {isFiltering ? 'Matches for your criteria' : 'Discovery Picks'}
              </h2>
              <span className="bg-slate-900 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">
                {filteredProperties.length} Properties
              </span>
           </div>
           {isFiltering && (
             <button 
               onClick={() => setFilters({ coaching: 'All', gender: 'All', area: 'All', activePills: [] })}
               className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 hover:underline"
             >
               Reset Filters
             </button>
           )}
        </div>

        <AnimatePresence mode="popLayout">
          {filteredProperties.length > 0 ? (
            <motion.div 
              layout 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10"
            >
              {filteredProperties.map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-24 px-8 text-center bg-white border border-slate-100 rounded-[32px] shadow-sm max-w-2xl mx-auto"
            >
               <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🏜️</div>
               <h3 className="text-2xl font-black text-slate-900 mb-2">No matching stays found</h3>
               <p className="text-slate-400 font-bold mb-10">We couldn't find any rooms that match all your selected filters. Showing our top recommendations instead.</p>
               
               <div className="space-y-4">
                 <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">Top Recommendations</p>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recommendations.map(p => (
                      <Link key={p.id} to={`/property/${p.id}`} className="group block">
                        <div className="aspect-square rounded-2xl overflow-hidden mb-2 border border-slate-100">
                           <img src={transformDriveUrl(p.PhotoMain)} className="w-full h-full object-cover group-hover:scale-110 transition-transform" alt={p.ListingName} />
                        </div>
                        <p className="text-xs font-black text-slate-900 truncate">{p.ListingName}</p>
                      </Link>
                    ))}
                 </div>
               </div>

               <button 
                 onClick={() => setFilters({ coaching: 'All', gender: 'All', area: 'All', activePills: [] })}
                 className="mt-12 bg-indigo-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
               >
                 Clear All Filters
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Host CTA Section */}
      <div className="max-w-7xl mx-auto px-4 mt-32 mb-20">
        <div className="bg-slate-900 rounded-[64px] p-12 lg:p-24 relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 p-12 opacity-5 -rotate-12 pointer-events-none"><Building2 size={300} /></div>
           <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full mb-8 border border-white/10">
                 <PlusCircle size={16} className="text-indigo-400" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Host Your Asset</span>
              </div>
              <h2 className="text-4xl lg:text-7xl font-black text-white tracking-tighter uppercase mb-8 leading-none">
                 Are you a property owner in Kota?
              </h2>
              <p className="text-white/60 font-bold text-lg mb-12 leading-relaxed">
                 Join Kota's most elite student housing network. List your PG, Hostel, or Flat for free and connect directly with thousands of scholars. Zero commission, 100% transparency.
              </p>
              <Link 
                to={!user ? '/login' : (user.role === UserRole.Admin ? '/admin/dashboard?action=add' : '/owner/dashboard?action=add')} 
                className="inline-flex items-center gap-4 bg-white text-slate-900 px-10 py-6 rounded-[32px] font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-indigo-500 hover:text-white transition-all group"
              >
                List Your Property Now <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
