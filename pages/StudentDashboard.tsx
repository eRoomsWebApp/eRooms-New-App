import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useProperties, DEFAULT_FILTERS } from '../context/PropertyContext';
import { motion, AnimatePresence } from 'framer-motion';
import PropertyCard from '../components/PropertyCard';
import OptimizedImage from '../components/OptimizedImage';
import {
  Sparkles, Timer, Focus, ChevronRight,
  Activity, Bookmark, Trash2, ArrowUpRight,
  ShieldCheck, Cpu, Fingerprint,
  Zap, BarChart3, Target, MessageCircle, Phone, Calendar, RefreshCw
} from 'lucide-react';
import { UserRole, SavedSearch, Lead } from '../types';
import { fetchLeads } from '../db';

const StudentDashboard: React.FC = () => {
  const { user, removeSavedSearch } = useAuth();
  const { properties, setFilters } = useProperties();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'dossier' | 'searches' | 'leads' | 'insights' | 'activity'>('dossier');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLeadsLoading, setIsLeadsLoading] = useState(false);

  const loadLeads = useCallback(async () => {
    if (!user) return;
    setIsLeadsLoading(true);
    try {
      const fetched = await fetchLeads(user.id, user.role);
      setLeads(fetched);
    } finally {
      setIsLeadsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const metrics = useMemo(
    () =>
      user?.behavioralMetrics || {
        avgSessionTime: 0,
        totalSessions: 0,
        pricePreference: { min: 0, max: 0 },
        topAreas: [],
        topFacilities: [],
        searchDepth: 0
      },
    [user]
  );

  const recommendedAssets = useMemo(() => {
    const maxBudget = metrics.pricePreference.max || 20000;
    return properties
      .filter(p => {
        const rents = Array.isArray(p.RentDouble) && p.RentDouble.length > 0 ? p.RentDouble : [0];
        return Math.min(...rents) <= maxBudget;
      })
      .slice(0, 3);
  }, [properties, metrics]);

  const handleApplySearch = (search: SavedSearch) => {
    setFilters({ ...DEFAULT_FILTERS, ...search.filters });
    navigate('/');
  };

  if (user?.role !== UserRole.Student) return null;

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20">
      <header className="bg-slate-900 text-white pt-24 pb-24 px-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-20 opacity-[0.03] rotate-12 select-none">
          <Fingerprint size={400} />
        </div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-10 relative z-10">
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-[38px] bg-blue-600 p-1 shadow-2xl shadow-blue-500/20 overflow-hidden">
                <OptimizedImage
                  src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                  className="w-full h-full rounded-[36px]"
                  alt="Avatar"
                />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-[0.4em]">Scholar Profile</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  <span className="text-[10px] font-black uppercase text-white/30 tracking-widest">Active Session</span>
                </div>
                <h1 className="text-4xl lg:text-6xl font-black tracking-tighter leading-none uppercase">
                  {user.username.split(' ')[0]} Dossier
                </h1>
              </div>
            </div>
            <p className="text-white/50 font-bold max-w-lg leading-relaxed text-sm">
              Your saved searches, shortlisted hostels, and inquiry history on eRooms.in Kota.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full md:w-auto">
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] min-w-[180px]">
              <Timer size={20} className="text-blue-400 mb-3" />
              <p className="text-3xl font-black text-white tracking-tighter">{metrics.avgSessionTime}m</p>
              <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">Avg Session</p>
            </div>
            <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-8 rounded-[40px] min-w-[180px]">
              <Focus size={20} className="text-amber-400 mb-3" />
              <p className="text-3xl font-black text-white tracking-tighter">{metrics.searchDepth}/10</p>
              <p className="text-[9px] font-black uppercase text-white/30 tracking-widest">Search Depth</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 -mt-12 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <aside className="lg:col-span-3 space-y-4">
            {[
              { id: 'dossier', label: 'Identity Hub', icon: ShieldCheck },
              { id: 'searches', label: 'Saved Signals', icon: Bookmark },
              { id: 'leads', label: 'My Inquiries', icon: Zap },
              { id: 'insights', label: 'Preferences', icon: BarChart3 },
              { id: 'activity', label: 'Activity Log', icon: Activity }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`w-full flex items-center justify-between p-6 rounded-[28px] transition-all group ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-xl border border-slate-100'
                    : 'bg-slate-100/60 text-slate-500 hover:text-slate-900 hover:bg-white border border-transparent'
                }`}
              >
                <div className="flex items-center gap-4">
                  <tab.icon size={20} className={activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-900'} />
                  <span className="text-[11px] font-black uppercase tracking-widest">{tab.label}</span>
                </div>
                <ChevronRight size={16} className={activeTab === tab.id ? 'opacity-100 text-blue-600' : 'opacity-0 group-hover:opacity-100'} />
              </button>
            ))}

            <div className="p-8 bg-blue-600 rounded-[40px] text-white shadow-xl relative overflow-hidden group mt-8">
              <Sparkles className="absolute -bottom-6 -right-6 w-28 h-28 opacity-20" />
              <h4 className="text-xl font-black mb-2 relative z-10 tracking-tight">Explore Kota</h4>
              <p className="text-xs font-bold text-blue-100 mb-6 leading-relaxed relative z-10">
                Browse verified hostels and PGs near your coaching institute.
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-white text-blue-600 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest relative z-10 shadow-lg hover:bg-slate-900 hover:text-white transition-all"
              >
                Open Catalogue
              </button>
            </div>
          </aside>

          <main className="lg:col-span-9 bg-white border border-slate-100 rounded-[48px] p-8 lg:p-14 shadow-sm min-h-[600px]">
            <AnimatePresence mode="wait">
              {activeTab === 'dossier' && (
                <motion.div key="dossier" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="flex justify-between items-end mb-12">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">Recommended Stays</h2>
                      <p className="text-slate-400 font-bold text-sm">Verified Kota properties within your budget range.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {recommendedAssets.map(p => (
                      <PropertyCard key={p.id} property={p} />
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'searches' && (
                <motion.div key="searches" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="mb-12">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">Saved Searches</h2>
                    <p className="text-slate-400 font-bold text-sm">Saved filter configurations.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(user.savedSearches || []).length > 0 ? (
                      user.savedSearches?.map(search => (
                        <div key={search.id} className="bg-[#f8fafc] border border-slate-100 p-8 rounded-[36px]">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h3 className="text-xl font-black text-slate-900 tracking-tight">{search.name}</h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                                Saved {new Date(search.timestamp).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <button onClick={() => handleApplySearch(search)} className="p-3 bg-blue-600 text-white rounded-xl hover:bg-slate-900 transition-all">
                                <ArrowUpRight size={18} />
                              </button>
                              <button onClick={() => removeSavedSearch(search.id)} className="p-3 bg-white text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-slate-100">
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {search.filters.coaching !== 'All' && (
                              <span className="px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-600">
                                {search.filters.coaching}
                              </span>
                            )}
                            {search.filters.area !== 'All' && (
                              <span className="px-3 py-1.5 bg-white border border-slate-100 rounded-lg text-[10px] font-black text-slate-600">
                                {search.filters.area.split(' (')[0]}
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="col-span-full py-24 text-center bg-slate-50 border border-dashed border-slate-200 rounded-[40px]">
                        <Bookmark size={48} className="mx-auto text-slate-300 mb-4" />
                        <h3 className="text-xl font-black text-slate-900 mb-2 uppercase">No Saved Searches</h3>
                        <button onClick={() => navigate('/')} className="mt-6 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest">
                          Explore Properties
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'leads' && (
                <motion.div key="leads" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-1">My Inquiries</h2>
                      <p className="text-slate-400 font-bold text-sm">Logged enquiries from your account.</p>
                    </div>
                    <button
                      onClick={loadLeads}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-700 hover:bg-slate-200"
                    >
                      <RefreshCw size={14} className={isLeadsLoading ? 'animate-spin' : ''} /> Refresh
                    </button>
                  </div>

                  {isLeadsLoading ? (
                    <div className="py-16 text-center text-xs font-black uppercase tracking-widest text-slate-400">Loading inquiries...</div>
                  ) : leads.length === 0 ? (
                    <div className="py-24 text-center bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                      <Zap size={48} className="mx-auto text-slate-300 mb-4" />
                      <h3 className="text-xl font-black text-slate-900 mb-2 uppercase">No Logged Inquiries</h3>
                      <p className="text-slate-500 font-bold text-sm max-w-sm mx-auto">
                        Browse properties and tap WhatsApp, Call, or Book Visit — no login needed.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {leads.map(lead => (
                        <div key={lead.id} className="bg-white border border-slate-100 p-8 rounded-[32px] shadow-sm">
                          <div className="flex items-center gap-4 mb-6">
                            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                              {lead.type === 'WhatsApp' && <MessageCircle size={20} />}
                              {lead.type === 'Call' && <Phone size={20} />}
                              {lead.type === 'VisitRequest' && <Calendar size={20} />}
                            </div>
                            <div>
                              <h4 className="text-lg font-black text-slate-900">{lead.propertyName}</h4>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{lead.type}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(lead.timestamp).toLocaleDateString()}</span>
                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-xl text-[9px] font-black uppercase tracking-widest">
                              {lead.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'insights' && (
                <motion.div key="insights" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-10">
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">Preferences</h2>
                    <p className="text-slate-400 font-bold text-sm">Summary of your saved budget and preferred localities.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-slate-900 text-white p-10 rounded-[40px] relative overflow-hidden">
                      <Target className="absolute -bottom-8 -right-8 w-48 h-48 opacity-5" />
                      <p className="text-[10px] font-black uppercase text-blue-400 tracking-[0.4em] mb-8">Budget Range</p>
                      <p className="text-5xl font-black tracking-tighter mb-2">
                        ₹{Math.round(metrics.pricePreference.min / 1000)}k-₹{Math.round(metrics.pricePreference.max / 1000)}k
                      </p>
                      <p className="text-[11px] font-black uppercase text-white/30 tracking-widest">Target Monthly Rent</p>
                    </div>

                    <div className="bg-white border border-slate-100 p-10 rounded-[40px] shadow-sm">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.4em] mb-8">Preferred Areas</p>
                      <div className="space-y-4">
                        {metrics.topAreas.map((area, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex justify-between text-[11px] font-black uppercase">
                              <span className="text-slate-900">{area}</span>
                              <span className="text-blue-600">{Math.max(20, 100 - i * 18)}%</span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.max(20, 100 - i * 18)}%` }} />
                            </div>
                          </div>
                        ))}
                        {metrics.topAreas.length === 0 && <p className="text-slate-400 font-bold text-sm py-8 text-center">No area preferences saved yet.</p>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'activity' && (
                <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                  <div className="mb-10">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase mb-2">Activity Log</h2>
                    <p className="text-slate-400 font-bold text-sm">Recent account events.</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-[40px] p-10">
                    {(user.activityLog || []).length > 0 ? (
                      <div className="space-y-6">
                        {user.activityLog?.map((log, i) => (
                          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center">
                            <div>
                              <h4 className="font-black text-slate-900 uppercase text-sm">{log.action}</h4>
                              <p className="text-xs font-bold text-slate-400 mt-1">{log.target || 'Platform'}</p>
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase">{new Date(log.timestamp).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-20 text-center">
                        <Cpu size={48} className="mx-auto text-slate-300 mb-4" />
                        <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">No activity recorded yet.</p>
                      </div>
                    )}
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
