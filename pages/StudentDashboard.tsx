
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertyContext';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyCard from '../components/PropertyCard';
import { 
  Heart, History, TrendingUp, MapPin, 
  Sparkles, Timer, Focus, ChevronRight,
  Activity, Bookmark, Trash2, ArrowUpRight,
  ShieldCheck, Cpu, Layout, Fingerprint,
  Zap, BarChart3, Target, MousePointer2
} from 'lucide-react';
import { UserRole, SavedSearch, UserStatus } from '../types';

const StudentDashboard: React.FC = () => {
  const { user, removeSavedSearch } = useAuth();
  const { properties, setFilters } = useProperties();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dossier' | 'searches' | 'insights' | 'activity'>('dossier');

  // Behavioral metrics from user object with intelligent defaults
  const metrics = user?.behavioralMetrics || {
    avgSessionTime: 0,
    totalSessions: 0,
    pricePreference: { min: 0, max: 0 },
    topAreas: [],
    topFacilities: [],
    searchDepth: 0
  };

  // Filter properties based on "Price Affinity" insight
  const recommendedAssets = useMemo(() => {
    return properties
      .filter(p => p.RentDouble <= (metrics.pricePreference.max || 20000))
      .slice(0, 3);
  }, [properties, metrics]);

  const handleApplySearch = (search: SavedSearch) => {
    setFilters(search.filters);
    navigate('/');
  };

  if (user?.role !== UserRole.Student) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      
      {/* 1. Scholar Dossier Header - Intelligence Theme */}
      <header className="bg-slate-900 text-white pt-24 pb-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-[0.03] rotate-12 select-none">
          <Fingerprint size={400} />
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-10 relative z-10">
           <div className="space-y-6">
              <div className="flex items-center gap-6">
                 <div className="w-24 h-24 rounded-[38px] bg-indigo-600 p-1 shadow-2xl shadow-indigo-500/20">
                    <img 
                      src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                      className="w-full h-full object-cover rounded-[36px]" 
                      alt="Avatar" 
                    />
                 </div>
                 <div>
                    <div className="flex items-center gap-3 mb-2">
                       <span className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.4em]">Scholar Node: {user.id}</span>
                       <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                       <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Active Session</span>
                    </div>
                    <h1 className="text-5xl lg:text-7xl font-black tracking-tighter leading-none uppercase">{user.username.split(' ')[0]} Dossier</h1>
                 </div>
              </div>
              <p className="text-white/40 font-bold max-w-lg leading-relaxed text-sm">
                Behavioral intelligence active. Every interaction is mapped to the Atlas Knowledge Graph to optimize your next discovery cycle.
              </p>
           </div>
           
           <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] min-w-[180px]">
                 <Timer size={20} className="text-indigo-400 mb-3" />
                 <p className="text-3xl font-black text-white tracking-tighter">{metrics.avgSessionTime}m</p>
                 <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">Avg Pulse Rate</p>
              </div>
              <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] min-w-[180px]">
                 <Focus size={20} className="text-amber-400 mb-3" />
                 <p className="text-3xl font-black text-white tracking-tighter">{metrics.searchDepth}/10</p>
                 <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">Inquiry Depth</p>
              </div>
           </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* Sidebar Tabs */}
          <aside className="lg:col-span-3 space-y-4">
             {[
               { id: 'dossier', label: 'Identity Hub', icon: ShieldCheck },
               { id: 'searches', label: 'Saved Signals', icon: Bookmark },
               { id: 'insights', label: 'Intelligence', icon: BarChart3 },
               { id: 'activity', label: 'Audit Trail', icon: Activity },
             ].map(tab => (
               <button
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`w-full flex items-center justify-between p-7 rounded-[32px] transition-all group ${
                   activeTab === tab.id 
                   ? 'bg-white text-slate-900 shadow-2xl shadow-slate-200 border border-slate-100' 
                   : 'bg-slate-100/40 text-slate-400 hover:text-slate-900 hover:bg-white border border-transparent'
                 }`}
               >
                 <div className="flex items-center gap-4">
                    <tab.icon size={20} className={activeTab === tab.id ? 'text-indigo-600' : 'text-slate-300 group-hover:text-slate-900'} />
                    <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
                 </div>
                 <ChevronRight size={16} className={activeTab === tab.id ? 'opacity-100 text-indigo-600' : 'opacity-0 group-hover:opacity-100'} />
               </button>
             ))}

             <div className="p-10 bg-indigo-600 rounded-[48px] text-white shadow-2xl shadow-indigo-100 relative overflow-hidden group mt-8">
                <Sparkles className="absolute -bottom-6 -right-6 w-32 h-32 opacity-20 group-hover:scale-110 transition-transform duration-700" />
                <h4 className="text-2xl font-black mb-2 relative z-10 tracking-tight">Predictive Match</h4>
                <p className="text-xs font-bold text-indigo-100/70 mb-10 leading-relaxed relative z-10">Our engine detected 3 new properties in {metrics.topAreas[0] || 'Kota'} matching your history.</p>
                <button onClick={() => navigate('/')} className="w-full bg-white text-indigo-600 py-5 rounded-[22px] text-[10px] font-black uppercase tracking-widest relative z-10 shadow-xl hover:bg-slate-900 hover:text-white transition-all">Execute Discovery</button>
             </div>
          </aside>

          {/* Workspace Content */}
          <main className="lg:col-span-9 bg-white border border-slate-100 rounded-[56px] p-10 lg:p-16 shadow-sm min-h-[700px]">
             <AnimatePresence mode="wait">
                
                {activeTab === 'dossier' && (
                  <motion.div key="dossier" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                     <div className="flex justify-between items-end mb-16">
                        <div>
                           <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Identity Assets</h2>
                           <p className="text-slate-400 font-bold text-sm">Platform interactions and primary collection.</p>
                        </div>
                        <span className="text-[10px] font-black uppercase text-slate-200 tracking-widest">{recommendedAssets.length} Stays Logged</span>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {recommendedAssets.map(p => (
                          <PropertyCard key={p.id} property={p} />
                        ))}
                        <button onClick={() => navigate('/')} className="border-4 border-dashed border-slate-50 rounded-[48px] flex flex-col items-center justify-center p-16 text-center group hover:border-indigo-100 transition-all hover:bg-slate-50/50">
                           <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center text-4xl mb-8 group-hover:scale-110 transition-transform shadow-sm">🔭</div>
                           <h3 className="font-black text-slate-900 uppercase text-xs mb-2 tracking-[0.2em]">Capture Assets</h3>
                           <p className="text-[10px] font-bold text-slate-300 px-10 leading-relaxed">Continue exploring the Kota cluster to grow your dossier.</p>
                        </button>
                     </div>
                  </motion.div>
                )}

                {activeTab === 'searches' && (
                  <motion.div key="searches" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                     <div className="flex justify-between items-end mb-16">
                        <div>
                           <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Saved Signals</h2>
                           <p className="text-slate-400 font-bold text-sm">Historical filter configurations stored in Atlas.</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {(user.savedSearches || []).length > 0 ? (
                          user.savedSearches?.map((search) => (
                            <div key={search.id} className="bg-[#f8fafc] border border-slate-100 p-10 rounded-[48px] hover:bg-white hover:shadow-2xl hover:border-transparent transition-all group relative overflow-hidden">
                               <div className="flex justify-between items-start relative z-10 mb-8">
                                  <div>
                                     <h3 className="text-2xl font-black text-slate-900 tracking-tight">{search.name}</h3>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Transmitted {new Date(search.timestamp).toLocaleDateString()}</p>
                                  </div>
                                  <div className="flex gap-2">
                                     <button onClick={() => handleApplySearch(search)} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-slate-900 transition-all shadow-xl"><ArrowUpRight size={20} /></button>
                                     <button onClick={() => removeSavedSearch(search.id)} className="p-4 bg-white text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm border border-slate-100"><Trash2 size={20} /></button>
                                  </div>
                               </div>
                               
                               <div className="flex flex-wrap gap-2 relative z-10">
                                  {search.filters.coaching !== 'All' && (
                                    <span className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase text-slate-500 tracking-widest shadow-sm">🏫 {search.filters.coaching}</span>
                                  )}
                                  {search.filters.area !== 'All' && (
                                    <span className="px-4 py-2 bg-white border border-slate-100 rounded-xl text-[9px] font-black uppercase text-slate-500 tracking-widest shadow-sm">📍 {search.filters.area.split(' (')[0]}</span>
                                  )}
                                  {search.filters.activePills.map(pill => (
                                    <span key={pill} className="px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-[9px] font-black uppercase text-indigo-600 tracking-widest shadow-sm">✨ {pill}</span>
                                  ))}
                               </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-full py-32 text-center bg-slate-50/50 border border-dashed border-slate-200 rounded-[64px]">
                             <Bookmark size={60} className="mx-auto text-slate-200 mb-8" />
                             <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">No Active Signals</h3>
                             <p className="text-slate-400 font-bold max-w-sm mx-auto leading-relaxed">Use the filter grid on the discovery hub to save your preferred configurations.</p>
                             <button onClick={() => navigate('/')} className="mt-10 px-12 py-5 bg-slate-900 text-white rounded-[24px] font-black text-[11px] uppercase tracking-widest shadow-2xl hover:bg-indigo-600 transition-all">Go Explore</button>
                          </div>
                        )}
                     </div>
                  </motion.div>
                )}

                {activeTab === 'insights' && (
                  <motion.div key="insights" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-16">
                     <div className="flex justify-between items-end">
                        <div>
                           <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Intelligence Output</h2>
                           <p className="text-slate-400 font-bold text-sm">Automated analysis of your behavioral discovery pattern.</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Financial Persona Card */}
                        <div className="bg-slate-900 text-white p-14 rounded-[64px] relative overflow-hidden shadow-[0_40px_80px_-16px_rgba(15,23,42,0.3)]">
                           <Target className="absolute -bottom-10 -right-10 w-64 h-64 opacity-5" />
                           <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.5em] mb-12">Budget Persona Match</p>
                           <div className="mb-12">
                              <p className="text-7xl font-black tracking-tighter mb-2 text-white/95">₹{metrics.pricePreference.min / 1000}k-₹{metrics.pricePreference.max / 1000}k</p>
                              <p className="text-[11px] font-black uppercase text-white/20 tracking-widest">Calculated Optimal Monthly Range</p>
                           </div>
                           <div className="p-8 bg-white/5 rounded-[32px] border border-white/10 backdrop-blur-sm">
                              <p className="text-sm font-bold leading-relaxed text-white/60 italic">
                                "Analysis of your profile indicates a heavy preference for <span className="text-indigo-400 underline decoration-indigo-400/30">Luxury Hostels</span> with 24/7 Mess availability."
                              </p>
                           </div>
                        </div>

                        {/* Cluster Affinity Chart */}
                        <div className="bg-white border border-slate-100 p-14 rounded-[64px] shadow-sm">
                           <p className="text-[10px] font-black uppercase text-slate-300 tracking-[0.5em] mb-12">Cluster Affinity Index</p>
                           <div className="space-y-10">
                              {metrics.topAreas.map((area, i) => (
                                <div key={i} className="space-y-4">
                                   <div className="flex justify-between text-[11px] font-black uppercase tracking-widest">
                                      <span className="text-slate-900">{area}</span>
                                      <span className="text-indigo-600 font-mono">{(100 - (i * 18)).toFixed(0)}% Depth</span>
                                   </div>
                                   <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden">
                                      <motion.div initial={{ width: 0 }} animate={{ width: `${100 - (i * 18)}%` }} transition={{ duration: 1.5, delay: i * 0.2 }} className="h-full bg-indigo-600 rounded-full" />
                                   </div>
                                </div>
                              ))}
                              {metrics.topAreas.length === 0 && <p className="text-slate-300 font-bold italic text-center py-20">Insufficient data for cluster analysis.</p>}
                           </div>
                        </div>
                     </div>

                     {/* DNA Facility Tags */}
                     <div className="bg-slate-50 border border-slate-100 p-14 rounded-[64px]">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mb-12">Amenity Genetic Code</p>
                        <div className="flex flex-wrap gap-4">
                           {metrics.topFacilities.map((f, i) => (
                             <div key={f} className="bg-white px-10 py-6 rounded-[32px] border border-slate-200 flex items-center gap-5 group hover:border-indigo-600 hover:shadow-xl transition-all">
                                <Zap size={24} className="text-indigo-600 group-hover:scale-125 transition-transform" />
                                <div>
                                   <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest">{f}</span>
                                   <p className="text-[8px] font-black text-slate-300 uppercase mt-1">Weight: {0.9 - (i * 0.1)}</p>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                  </motion.div>
                )}

                {activeTab === 'activity' && (
                  <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                     <div className="flex justify-between items-end mb-16">
                        <div>
                           <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase mb-2">Audit Trail</h2>
                           <p className="text-slate-400 font-bold text-sm">Chronological log of platform node interactions.</p>
                        </div>
                     </div>

                     <div className="bg-[#f8fafc] border border-slate-100 rounded-[64px] p-12 lg:p-20 relative overflow-hidden">
                        <div className="space-y-20 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200">
                           {(user.activityLog || []).length > 0 ? (
                             user.activityLog?.map((log, i) => (
                               <div key={i} className="relative pl-16 group">
                                  <div className={`absolute left-[-1px] top-1.5 w-6 h-6 rounded-full border-[5px] border-[#f8fafc] shadow-md transition-transform group-hover:scale-125 ${
                                    log.importance === 'high' ? 'bg-indigo-600' : 'bg-slate-400'
                                  }`} />
                                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
                                     <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{log.action}</h4>
                                     <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap bg-white px-3 py-1 rounded-full border border-slate-100 shadow-sm">
                                        {new Date(log.timestamp).toLocaleDateString()} • {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                     </span>
                                  </div>
                                  <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm group-hover:shadow-xl transition-all group-hover:-translate-y-1">
                                     <p className="text-xs font-bold text-slate-400">Target Segment: <span className="text-slate-900 font-black">{log.target || 'Platform Core'}</span></p>
                                     {log.metadata && (
                                       <div className="mt-6 pt-6 border-t border-slate-50 flex flex-wrap gap-8">
                                          {Object.entries(log.metadata).map(([k, v]) => (
                                            <div key={k}>
                                               <p className="text-[9px] font-black uppercase text-slate-300 mb-1 tracking-widest">{k}</p>
                                               <p className="text-xs font-black text-indigo-600 uppercase tracking-tight">{String(v)}</p>
                                            </div>
                                          ))}
                                       </div>
                                     )}
                                  </div>
                               </div>
                             ))
                           ) : (
                             <div className="py-32 text-center">
                                <Cpu size={60} className="mx-auto text-slate-200 mb-8 animate-pulse" />
                                <p className="text-slate-300 font-black uppercase tracking-[0.4em] text-[11px]">Dossier empty. Initiate exploration.</p>
                             </div>
                           )}
                        </div>
                     </div>
                  </motion.div>
                )}

             </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
