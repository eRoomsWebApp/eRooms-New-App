
import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useProperties } from '../context/PropertyContext';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyCard from '../components/PropertyCard';
import { 
  Heart, History, TrendingUp, MapPin, 
  Wind, Wifi, Utensils, Zap, Search, 
  Sparkles, Timer, Focus, Target, ChevronRight,
  User, ShieldCheck, Calendar, Activity, LayoutGrid
} from 'lucide-react';
import { UserRole } from '../types';

const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const { properties } = useProperties();
  const [activeTab, setActiveTab] = useState<'wishlist' | 'activity' | 'insights'>('wishlist');

  // Use dummy wishlist for demo if user has none
  const wishlist = useMemo(() => {
    return properties.slice(0, 3);
  }, [properties]);

  const stats = [
    { label: 'Viewed Assets', val: '128', icon: History, color: 'text-indigo-600' },
    { label: 'Saved Stays', val: wishlist.length, icon: Heart, color: 'text-rose-600' },
    { label: 'Search Depth', val: '8.4', icon: Focus, color: 'text-amber-600' },
    { label: 'Discovery Time', val: '12m', icon: Timer, color: 'text-blue-600' },
  ];

  if (user?.role !== UserRole.Student) return null;

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      
      {/* Header Narrative */}
      <header className="bg-white border-b border-slate-100 pt-20 pb-16 px-4 mb-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-10">
           <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="bg-slate-900 text-white w-12 h-12 rounded-2xl flex items-center justify-center font-black text-2xl shadow-xl">
                   {user.username[0]}
                 </div>
                 <div>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em]">Scholar Hub</p>
                    <h1 className="text-4xl lg:text-6xl font-black text-slate-900 tracking-tighter">Welcome, {user.username.split(' ')[0]}</h1>
                 </div>
              </div>
              <p className="text-slate-400 font-bold max-w-lg leading-relaxed">Your student discovery engine is optimized. We've updated your property narrative based on your recent searches in <span className="text-indigo-600">Landmark City</span>.</p>
           </div>
           
           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full lg:w-auto">
              {stats.map((s, i) => (
                <div key={i} className="bg-white border border-slate-100 p-6 rounded-[28px] shadow-sm">
                   <s.icon size={18} className={`${s.color} mb-2`} />
                   <p className="text-2xl font-black text-slate-900 tracking-tighter">{s.val}</p>
                   <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
                </div>
              ))}
           </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Navigation Sidebar */}
        <aside className="lg:col-span-3 space-y-4">
           {[
             { id: 'wishlist', label: 'Saved Assets', icon: Heart },
             { id: 'insights', label: 'Search Insights', icon: TrendingUp },
             { id: 'activity', label: 'Activity Log', icon: Activity },
           ].map(tab => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={`w-full flex items-center justify-between p-6 rounded-[24px] transition-all group ${
                 activeTab === tab.id 
                 ? 'bg-slate-900 text-white shadow-2xl shadow-slate-200' 
                 : 'bg-white border border-slate-100 text-slate-400 hover:text-slate-900'
               }`}
             >
               <div className="flex items-center gap-4">
                  <tab.icon size={20} />
                  <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
               </div>
               <ChevronRight size={16} className={activeTab === tab.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} />
             </button>
           ))}

           <div className="p-8 bg-indigo-600 rounded-[32px] text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
              <Sparkles className="absolute -bottom-4 -right-4 w-24 h-24 opacity-20" />
              <h4 className="text-xl font-black mb-2 relative z-10">Smart Match</h4>
              <p className="text-xs font-bold text-indigo-100/70 mb-6 leading-relaxed relative z-10">We found 12 new properties in Jawahar Nagar that match your AC + RO preference.</p>
              <button className="bg-white text-indigo-600 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest relative z-10">View Matches</button>
           </div>
        </aside>

        {/* Content Workspace */}
        <main className="lg:col-span-9">
           <AnimatePresence mode="wait">
              
              {activeTab === 'wishlist' && (
                <motion.div key="wishlist" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                   <div className="flex justify-between items-center mb-8">
                      <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Your Wishlist</h2>
                      <span className="text-[10px] font-black uppercase text-slate-300 tracking-widest">{wishlist.length} Items Locked</span>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {wishlist.map(p => (
                        <PropertyCard key={p.id} property={p} />
                      ))}
                      <div className="border-4 border-dashed border-slate-100 rounded-[32px] flex flex-col items-center justify-center p-12 text-center group hover:border-indigo-100 transition-colors">
                         <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">🔍</div>
                         <h3 className="font-black text-slate-900 uppercase text-xs mb-1">Discover More</h3>
                         <p className="text-[10px] font-bold text-slate-400">Add more narrative to your collection.</p>
                      </div>
                   </div>
                </motion.div>
              )}

              {activeTab === 'insights' && (
                <motion.div key="insights" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Cluster Affinity */}
                      <section className="bg-white border border-slate-100 p-8 rounded-[40px] shadow-sm">
                         <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-8">Cluster Affinity</h3>
                         <div className="space-y-6">
                            {[
                              { label: 'Landmark City', val: 92, color: 'bg-indigo-600' },
                              { label: 'Coral Park', val: 64, color: 'bg-blue-500' },
                              { label: 'Kunadi', val: 41, color: 'bg-slate-400' },
                            ].map((area, i) => (
                              <div key={i} className="space-y-2">
                                 <div className="flex justify-between text-[11px] font-black uppercase">
                                    <span className="text-slate-900">{area.label}</span>
                                    <span className="text-slate-400">{area.val}% Match</span>
                                 </div>
                                 <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${area.val}%` }} className={`h-full ${area.color}`} />
                                 </div>
                              </div>
                            ))}
                         </div>
                      </section>

                      {/* Financial Sweet Spot */}
                      <section className="bg-slate-900 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-10"><Zap size={80} /></div>
                         <h3 className="text-[10px] font-black uppercase text-white/30 tracking-[0.3em] mb-8">Financial Persona</h3>
                         <div className="mb-10">
                            <p className="text-5xl font-black tracking-tighter mb-2">₹12k - ₹18k</p>
                            <p className="text-[11px] font-black uppercase text-indigo-400 tracking-widest">Ideal Monthly Allocation</p>
                         </div>
                         <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-[9px] font-black uppercase text-white/40 mb-1">Market Sentiment</p>
                            <p className="text-xs font-bold leading-relaxed">You tend to prioritize <span className="text-indigo-400">Premium Amenities</span> over absolute budget constraints.</p>
                         </div>
                      </section>
                   </div>

                   {/* Facility Radar */}
                   <section className="bg-white border border-slate-100 p-10 rounded-[40px]">
                      <h3 className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-10">Feature Frequency</h3>
                      <div className="flex flex-wrap gap-4">
                         {['AC (98%)', 'WiFi (100%)', 'Attached Washroom (85%)', 'Mess Facility (72%)', 'Biometric Entry (60%)'].map(f => (
                           <div key={f} className="px-6 py-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                              <Sparkles size={16} className="text-amber-500" />
                              <span className="font-black text-slate-900 text-[11px] uppercase">{f}</span>
                           </div>
                         ))}
                      </div>
                   </section>
                </motion.div>
              )}

              {activeTab === 'activity' && (
                <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                   <div className="bg-white border border-slate-100 rounded-[40px] p-10 shadow-sm">
                      <div className="space-y-12 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                         {user.activityLog?.map((log, i) => (
                           <div key={i} className="relative pl-12">
                              <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-md ${
                                log.importance === 'high' ? 'bg-indigo-600' : log.importance === 'medium' ? 'bg-amber-500' : 'bg-slate-300'
                              }`} />
                              <div className="flex justify-between items-start mb-1">
                                 <h4 className="text-lg font-black text-slate-900 leading-none">{log.action}</h4>
                                 <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                              <p className="text-sm font-bold text-slate-400 italic">Target Node: {log.target}</p>
                           </div>
                         ))}
                         {!user.activityLog?.length && (
                            <div className="py-20 text-center">
                               <p className="text-slate-300 font-black uppercase tracking-widest text-xs">Activity Stream is Empty</p>
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
  );
};

export default StudentDashboard;
